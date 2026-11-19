#!/usr/bin/env python3
import datetime
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import auto_publish_curseforge as publisher
import auto_bump_and_build as builder


class AutoPublishTests(unittest.TestCase):
    def test_build_workflow_receives_changed_projects(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "github-output"
            with patch.dict(os.environ, {"GITHUB_OUTPUT": str(output)}):
                builder._write_rebuilt_projects(["MCPEDL/Addons/Example"])
            content = output.read_text()
            self.assertIn("has_rebuilt_projects=true", content)
            self.assertIn("MCPEDL/Addons/Example", content)

    def test_unregistered_pack_is_refused_without_building(self):
        with tempfile.TemporaryDirectory() as temp:
            with patch.object(publisher.release, "REPO_ROOT", Path(temp)):
                with patch.dict(os.environ, {"CURSEFORGE_API_TOKEN": "x"}):
                    with patch.object(publisher.release, "prepare") as prepare:
                        with self.assertRaisesRegex(ValueError, "Register CurseForge ID"):
                            publisher.publish("MCPEDL/Addons/Example")
                        prepare.assert_not_called()

    def test_id_requires_api_token(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "builds").mkdir(parents=True)
            (root / "builds/.three_part_version_migrated").touch()
            (root / "builds/Curseforge_IDs.json").write_text(
                '{"MCPEDL/Addons/Example":{"project_id":"123"}}'
            )
            with patch.object(publisher.release, "REPO_ROOT", root):
                with patch.dict(os.environ, {"CURSEFORGE_API_TOKEN": ""}):
                    with self.assertRaisesRegex(ValueError, "CURSEFORGE_API_TOKEN"):
                        publisher.publish("MCPEDL/Addons/Example")

    def test_map_all_uploads_each_variant_and_bumps_only_once(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "builds").mkdir(parents=True)
            (root / "builds/Curseforge_IDs.json").write_text(
                '{"MCPEDL/Maps/Example":{"project_id":"123"}}'
            )
            package = root / "Example.mcworld"
            package.touch()
            prepare_calls = []
            metadata_files = []

            def prepare(project, release_type, map_variant, rebuild, bump):
                prepare_calls.append((map_variant, rebuild, bump))
                metadata = root / f"{map_variant}.json"
                metadata.touch()
                metadata_files.append(metadata)
                return package, metadata, "123", root / "info.json", [], "1.1.0"

            with patch.object(publisher.release, "REPO_ROOT", root):
                with patch.object(publisher.release, "prepare", side_effect=prepare):
                    with patch.dict(os.environ, {"CURSEFORGE_API_TOKEN": "test-token"}):
                        with patch.object(publisher.subprocess, "run") as run:
                            self.assertTrue(publisher.publish(
                                "MCPEDL/Maps/Example",
                                map_variant="all",
                            ))

            self.assertEqual(
                prepare_calls,
                [("Creative", True, True), ("Survival", False, False), ("Hardcore", False, False)],
            )
            self.assertEqual(run.call_count, 3)
            self.assertTrue(all(not path.exists() for path in metadata_files))
            saved = json.loads((root / "builds/Curseforge_IDs.json").read_text())
            self.assertEqual(saved["MCPEDL/Maps/Example"]["last_published_version"], "1.1.0")
            self.assertEqual(saved["MCPEDL/Maps/Example"]["project_id"], "123")

    def test_old_per_pack_files_are_migrated_into_the_registry(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "MCPEDL/Addons/Old").mkdir(parents=True)
            (root / "builds/Old").mkdir(parents=True)
            legacy = root / "builds/Old/Curseforge_Info.json"
            legacy.write_text('{"project_id":"77","last_published_version":"1.2.0"}')
            with patch.object(publisher.release, "REPO_ROOT", root):
                info = publisher.release.read_info("MCPEDL/Addons/Old")
                self.assertEqual(info["project_id"], "77")
                self.assertEqual(info["last_published_version"], "1.0.0")
                publisher.release.save_info("MCPEDL/Addons/New", "88")
            saved = json.loads((root / "builds/Curseforge_IDs.json").read_text())
            self.assertEqual(sorted(saved), ["MCPEDL/Addons/New", "MCPEDL/Addons/Old"])
            self.assertEqual(saved["MCPEDL/Addons/Old"]["last_published_version"], "1.0.0")
            self.assertFalse(legacy.exists())

    # ---- single-number versions (vX) and tolerant changelog headings ----

    def _log(self, temp, text):
        project = Path(temp)
        (project / "manifest.json").write_text('{"header":{"version":[1,0,0]}}')
        log = project / "CHANGELOG.md"
        log.write_text(text)
        return project, log

    def test_parse_and_format_single_number_versions(self):
        rel = publisher.release
        for text in ("v12", "V12", "12"):
            self.assertEqual(rel.parse_version(text), (12, 0, 0))
        self.assertEqual(rel.format_version((12, 0, 0)), "12")
        self.assertEqual(rel.parse_version("1.2.3"), (1, 2, 3))
        self.assertEqual(rel.format_version((1, 2, 3)), "1.2.3")
        with self.assertRaisesRegex(ValueError, "expected vX"):
            rel.parse_version("twelve")

    def test_any_changelog_heading_style_is_understood(self):
        rel = publisher.release
        for heading, version in (
            ("## [v12] - 2026-11-19", "v12"), ("## [V12] - 2026-11-19 - Big Update", "V12"),
            ("## [12] - 2026-11-19", "12"), ("## v12", "v12"), ("## [v12]", "v12"),
            ("## [v12] \u2013 2026-11-19 \u2013 Name", "v12"), ("## v12: Name", "v12"),
            ("## [1.2.3] - 2026-11-06", "1.2.3"), ("## [v12] - 2026-11-19\r", "v12"),
        ):
            match = rel.CHANGELOG_HEADER.fullmatch(heading)
            self.assertIsNotNone(match, heading)
            self.assertEqual(match.group(1), version, heading)
        for heading in ("## [Unreleased]", "## Notes", "## 2026-11-19", "## 2026", "## v12 things"):
            self.assertIsNone(rel.CHANGELOG_HEADER.fullmatch(heading), heading)

    def test_every_bump_is_plus_one(self):
        rel = publisher.release
        for kind in ("release", "beta", "update"):
            self.assertEqual(rel.next_version((12, 0, 0), kind), "13")
        self.assertEqual(rel.next_version((12, 0, 0), "keep"), "12")
        self.assertEqual(rel.prior_version("v12"), "11")

    def test_keep_publishes_newest_and_never_touches_the_changelog(self):
        with tempfile.TemporaryDirectory() as temp:
            original = ("# Changelog\n\n## [Unreleased]\n\n- soon\n\n## v12\n\n### Fixed\n- B\n\n"
                        "## [11] - 2026-11-01\n\n### Added\n- A\n\n## [v10] - 2026-10-01\n\n- Old\n")
            project, log = self._log(temp, original)
            version, upload = publisher.release.combine_changelog(
                project, log, "v10", today=datetime.date(2026, 11, 19), release_type="keep")
            self.assertEqual(version, "12")
            self.assertIn("Packed with 2 updates, from v11 through v12", upload)
            self.assertNotIn("Old", upload)
            self.assertNotIn("soon", upload)
            self.assertEqual(log.read_text(), original)  # not rewritten
            with self.assertRaisesRegex(ValueError, "Nothing new"):
                publisher.release.combine_changelog(project, log, "v12", release_type="keep")
            self.assertEqual(publisher.release.latest_changelog_entry(log)[0], "12")

    def test_registry_value_with_v_prefix_works(self):
        with tempfile.TemporaryDirectory() as temp:
            project, log = self._log(temp, "# Changelog\n\n## [v12] - 2026-11-19\n\n- New\n\n## [v11] - 2026-11-01\n\n- Prev\n")
            version, _ = publisher.release.combine_changelog(project, log, "v11", release_type="keep")
            self.assertEqual(version, "12")

    def test_manifests_become_x_0_0_with_v_title(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            project = root / "MCPEDL/Addons/Pack"
            project.mkdir(parents=True)
            (project / "manifest.json").write_text(json.dumps({
                "header": {"name": "Pack (v11)", "uuid": "a", "version": [11, 0, 0]},
                "modules": [{"version": [11, 0, 0]}],
            }))
            with patch.object(publisher.release, "REPO_ROOT", root):
                publisher.release.align_manifests(project, "12")
            data = json.loads((project / "manifest.json").read_text())
            self.assertEqual(data["header"]["version"], [12, 0, 0])
            self.assertEqual(data["header"]["name"], "Pack (v12)")
            self.assertEqual(data["modules"][0]["version"], [12, 0, 0])
            self.assertEqual(data["metadata"]["version"], "12.0.0")
            with patch.object(publisher.release, "REPO_ROOT", root):
                with self.assertRaisesRegex(ValueError, "older than"):
                    publisher.release.align_manifests(project, "v11")

    def test_upload_name_uses_single_number(self):
        rel = publisher.release
        self.assertEqual(rel.upload_name("release", "Mining-Helmet", ".mcaddon", "default", "12"), "MiningHelmet V12.mcaddon")
        self.assertEqual(rel.upload_name("release", "Mining-Helmet", ".mcaddon", "default", "v12"), "MiningHelmet V12.mcaddon")
        self.assertEqual(rel.upload_name("release", "Oneblock-SM", ".mcworld", "Creative", "3"), "OneblockSM V3 Creative.mcworld")

    def test_pending_packs_with_mixed_heading_styles(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "builds").mkdir()
            (root / "builds/.three_part_version_migrated").touch()
            registry = {}
            for name, heading, last in (("New", "## v1", None), ("Behind", "## [v12] - 2026-11-01", "v11"), ("Current", "## [5]", "v5")):
                pack = root / "MCPEDL/Addons" / name
                pack.mkdir(parents=True)
                (pack / "CHANGELOG.md").write_text(f"# Changelog\n\n{heading}\n\n- x\n")
                registry[f"MCPEDL/Addons/{name}"] = {"project_id": "1", **({"last_published_version": last} if last else {})}
            (root / "builds/Curseforge_IDs.json").write_text(json.dumps(registry))
            with patch.object(publisher.release, "REPO_ROOT", root):
                self.assertEqual(publisher.pending_packs(), ["MCPEDL/Addons/Behind", "MCPEDL/Addons/New"])


if __name__ == "__main__":
    unittest.main()
