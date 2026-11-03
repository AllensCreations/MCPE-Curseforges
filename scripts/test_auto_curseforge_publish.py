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
                self.assertEqual(info["last_published_version"], "1.2.0")
                publisher.release.save_info("MCPEDL/Addons/New", "88")
            saved = json.loads((root / "builds/Curseforge_IDs.json").read_text())
            self.assertEqual(sorted(saved), ["MCPEDL/Addons/New", "MCPEDL/Addons/Old"])
            self.assertEqual(saved["MCPEDL/Addons/Old"]["last_published_version"], "1.2.0")
            self.assertFalse(legacy.exists())

    def test_changelog_entries_are_combined_and_version_bumped(self):
        with tempfile.TemporaryDirectory() as temp:
            project = Path(temp)
            (project / "manifest.json").write_text('{"header":{"version":[1,4,2]}}')
            log = project / "CHANGELOG.md"
            log.write_text(
                "# Changelog\n\n"
                "## [1.4.2] - 2026-10-30\n\n### Fixed\n- C\n\n"
                "## [1.3.1] - 2026-10-10\n\n### Fixed\n- D\n\n"
                "## [1.4.1] - 2026-10-20\n\n### Fixed\n- B\n\n"
                "## [1.3.0] - 2026-10-01\n\n- A\n"
            )
            version, entry = publisher.release.combine_changelog(
                project, log, "1.3.0", today=datetime.date(2026, 11, 3)
            )
            self.assertEqual(version, "1.5.0")
            self.assertIn("## [1.5.0] - 2026-11-03", entry)
            self.assertIn("What's new in v1.5.0", entry)
            self.assertIn("Packed with 3 updates", entry)
            self.assertIn("### v1.4.x (v1.4.1 \u2013 v1.4.2)", entry)
            self.assertIn("### v1.3.x (v1.3.1)", entry)
            self.assertEqual(entry.count("#### Fixed"), 2)
            self.assertIn("- B", entry)
            self.assertIn("- C", entry)
            self.assertNotIn("- A", entry)
            text = log.read_text()
            self.assertTrue(text.index("[1.5.0]") < text.index("[1.3.0]"))
            self.assertNotIn("## [1.4.2]", text)
            with self.assertRaisesRegex(ValueError, "Nothing new"):
                publisher.release.combine_changelog(project, log, "1.5.0")

    def _project(self, temp, manifest, log_text):
        project = Path(temp)
        (project / "manifest.json").write_text(json.dumps({"header": {"version": manifest}}))
        log = project / "CHANGELOG.md"
        log.write_text(log_text)
        return project, log

    def _publish(self, project, log, info, release_type, day):
        rel = publisher.release
        version, entry = rel.combine_changelog(
            project, log, info.get("last_published_version"), today=datetime.date(2026, 11, day),
            release_type=release_type, last_release=info.get("last_release_version"),
        )
        after = publisher.release_baseline_after(release_type, info, version)
        info["last_published_version"] = version
        if after:
            info["last_release_version"] = after
        (project / "manifest.json").write_text(json.dumps({"header": {"version": [int(p) for p in version.split(".")]}}))
        return version, entry

    def test_beta_bumps_patch_and_release_combines_every_beta(self):
        with tempfile.TemporaryDirectory() as temp:
            project, log = self._project(
                temp, [1, 3, 0],
                "# Changelog\n\n## [1.3.0] - 2026-10-01\n\n### Added\n- Base\n",
            )
            info = {"project_id": "1", "last_published_version": "1.3.0", "last_release_version": "1.3.0"}

            log.write_text(log.read_text().replace("# Changelog\n\n", "# Changelog\n\n## [1.3.1] - 2026-11-01\n\n### Fixed\n- Beta fix one\n\n", 1))
            version, entry = self._publish(project, log, info, "beta", 1)
            self.assertEqual(version, "1.3.1")
            self.assertEqual(info["last_release_version"], "1.3.0")

            log.write_text(log.read_text().replace("# Changelog\n\n", "# Changelog\n\n## [1.3.2] - 2026-11-02\n\n### Added\n- Beta feature two\n\n", 1))
            version, entry = self._publish(project, log, info, "beta", 2)
            self.assertEqual(version, "1.3.2")
            self.assertNotIn("Beta fix one", entry)
            self.assertIn("## [1.3.1]", log.read_text())

            log.write_text(log.read_text().replace("# Changelog\n\n", "# Changelog\n\n## [1.3.3] - 2026-11-03\n\n### Fixed\n- Unpublished fix\n\n", 1))
            version, entry = self._publish(project, log, info, "release", 3)
            self.assertEqual(version, "1.4.0")
            self.assertEqual(info["last_release_version"], "1.4.0")
            for expected in ("Beta fix one", "Beta feature two", "Unpublished fix"):
                self.assertIn(expected, entry)
            self.assertNotIn("Base", entry)
            self.assertIn("Packed with 3 updates", entry)
            text = log.read_text()
            self.assertEqual(text.count("## ["), 2)
            self.assertIn("## [1.4.0]", text)
            self.assertIn("## [1.3.0]", text)

    def test_release_with_no_new_entry_still_promotes_published_betas(self):
        with tempfile.TemporaryDirectory() as temp:
            project, log = self._project(
                temp, [1, 3, 1],
                "# Changelog\n\n## [1.3.1] - 2026-11-01\n\n### Fixed\n- Beta fix\n\n## [1.3.0] - 2026-10-01\n\n- Base\n",
            )
            info = {"project_id": "1", "last_published_version": "1.3.1", "last_release_version": "1.3.0"}
            version, entry = self._publish(project, log, info, "release", 3)
            self.assertEqual(version, "1.4.0")
            self.assertIn("Beta fix", entry)
            with self.assertRaisesRegex(ValueError, "Nothing new"):
                publisher.release.combine_changelog(project, log, "1.4.0", release_type="release", last_release="1.4.0")

    def test_first_ever_beta_records_the_version_before_it_as_release_baseline(self):
        with tempfile.TemporaryDirectory() as temp:
            project, log = self._project(
                temp, [1, 0, 0], "# Changelog\n\n## [1.0.0] - 2026-10-01\n\n- First\n",
            )
            info = {"project_id": "1"}
            version, _ = self._publish(project, log, info, "beta", 1)
            self.assertEqual(version, "1.0.1")
            self.assertEqual(info["last_release_version"], "1.0.0")
            log.write_text(log.read_text().replace("# Changelog\n\n", "# Changelog\n\n## [1.0.2] - 2026-11-02\n\n- Second\n\n", 1))
            self._publish(project, log, info, "beta", 2)
            version, entry = self._publish(project, log, info, "release", 3)
            self.assertEqual(version, "1.1.0")
            self.assertIn("First", entry)

    def test_old_registry_entry_without_release_field_falls_back_to_last_published(self):
        info = {"project_id": "1", "last_published_version": "1.2.0"}
        self.assertEqual(publisher.release.merge_baseline("release", info), "1.2.0")
        self.assertEqual(publisher.release.merge_baseline("beta", info), "1.2.0")
        self.assertEqual(publisher.release_baseline_after("beta", info, "1.2.1"), "1.2.0")
        self.assertEqual(publisher.release_baseline_after("alpha", {"last_release_version": "1.1.0"}, "1.2.1"), None)
        self.assertEqual(publisher.release.next_version((1, 2, 5), "alpha"), "1.2.6")
        self.assertEqual(publisher.release.next_version((1, 2, 5), "release"), "1.3.0")

    def test_publish_records_release_version_only_for_releases(self):
        for release_type, expect_release in (("beta", None), ("release", "1.4.0")):
            with tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                (root / "builds").mkdir(parents=True)
                (root / "builds/Curseforge_IDs.json").write_text(
                    '{"MCPEDL/Addons/Example":{"project_id":"5","last_published_version":"1.3.1","last_release_version":"1.3.0"}}'
                )
                package = root / "Example.mcaddon"
                package.touch()
                version = "1.4.0" if release_type == "release" else "1.3.2"

                def prepare(project, rtype, map_variant, rebuild, bump, version=version):
                    metadata = root / "meta.json"
                    metadata.touch()
                    return package, metadata, "5", root / "info.json", [], version

                with patch.object(publisher.release, "REPO_ROOT", root):
                    with patch.object(publisher.release, "prepare", side_effect=prepare):
                        with patch.dict(os.environ, {"CURSEFORGE_API_TOKEN": "t"}):
                            with patch.object(publisher.subprocess, "run"):
                                publisher.publish("MCPEDL/Addons/Example", release_type=release_type)
                saved = json.loads((root / "builds/Curseforge_IDs.json").read_text())["MCPEDL/Addons/Example"]
                self.assertEqual(saved["last_published_version"], version)
                self.assertEqual(saved["last_release_version"], expect_release or "1.3.0")


if __name__ == "__main__":
    unittest.main()
