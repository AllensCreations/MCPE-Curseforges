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

    def test_beta_merges_all_unreleased_entries_into_one_grouped_entry(self):
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
                project, log, "1.3.0", today=datetime.date(2026, 11, 3), release_type="beta"
            )
            self.assertEqual(version, "1.5.0")
            self.assertIn("## [1.5.0] - 2026-11-03", entry)
            self.assertIn("Packed with 3 updates", entry)
            self.assertEqual(entry.count("### Fixed"), 1)  # one grouped list, not one per version
            for expected in ("- B", "- C", "- D"):
                self.assertIn(expected, entry)
            self.assertNotIn("- A", entry)
            self.assertNotIn("<div", entry)
            self.assertEqual(publisher.release.changelog_type("beta"), "markdown")
            text = log.read_text()
            self.assertTrue(text.index("[1.5.0]") < text.index("[1.3.0]"))
            self.assertNotIn("## [1.4.2]", text)
            with self.assertRaisesRegex(ValueError, "Nothing new"):
                publisher.release.combine_changelog(project, log, "1.5.0", release_type="beta")

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
        updates = rel.baselines_after(release_type, info, version)
        info["last_published_version"] = version
        info.update(updates)
        (project / "manifest.json").write_text(json.dumps({"header": {"version": [int(p) for p in version.split(".")[:3]]}}))
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
            self.assertEqual(version, "1.4.0")
            self.assertEqual(info["last_release_version"], "1.3.0")

            log.write_text(log.read_text().replace("# Changelog\n\n", "# Changelog\n\n## [1.4.1] - 2026-11-02\n\n### Added\n- Beta feature two\n\n", 1))
            version, entry = self._publish(project, log, info, "beta", 2)
            self.assertEqual(version, "1.5.0")
            self.assertNotIn("Beta fix one", entry)
            self.assertIn("## [1.4.0]", log.read_text())

            log.write_text(log.read_text().replace("# Changelog\n\n", "# Changelog\n\n## [1.5.1] - 2026-11-03\n\n### Fixed\n- Unpublished fix\n\n", 1))
            version, entry = self._publish(project, log, info, "release", 3)
            self.assertEqual(version, "2.0.0")
            self.assertEqual(info["last_release_version"], "2.0.0")
            for expected in ("Beta fix one", "Beta feature two", "Unpublished fix", "Base"):
                self.assertIn(expected, entry)  # the whole history is folded in
            self.assertIn("<h3>v1.x.x (4 updates)</h3>", entry)
            text = log.read_text()
            self.assertEqual(text.count("## ["), 2)
            self.assertIn("## [2.0.0]", text)
            self.assertIn("## [1.3.0]", text)
            self.assertNotIn("<div", text)  # CHANGELOG.md stays plain

    def test_release_with_no_new_entry_still_promotes_published_betas(self):
        with tempfile.TemporaryDirectory() as temp:
            project, log = self._project(
                temp, [1, 3, 1],
                "# Changelog\n\n## [1.3.1] - 2026-11-01\n\n### Fixed\n- Beta fix\n\n## [1.3.0] - 2026-10-01\n\n- Base\n",
            )
            info = {"project_id": "1", "last_published_version": "1.3.1", "last_release_version": "1.3.0"}
            version, entry = self._publish(project, log, info, "release", 3)
            self.assertEqual(version, "2.0.0")
            self.assertIn("Beta fix", entry)
            with self.assertRaisesRegex(ValueError, "Nothing new"):
                publisher.release.combine_changelog(project, log, "2.0.0", release_type="beta")

    def test_first_ever_beta_records_the_version_before_it_as_release_baseline(self):
        with tempfile.TemporaryDirectory() as temp:
            project, log = self._project(
                temp, [1, 0, 0], "# Changelog\n\n## [1.0.0] - 2026-10-01\n\n- First\n",
            )
            info = {"project_id": "1"}
            version, _ = self._publish(project, log, info, "beta", 1)
            self.assertEqual(version, "1.1.0")
            self.assertEqual(info["last_release_version"], "1.0.0")
            log.write_text(log.read_text().replace("# Changelog\n\n", "# Changelog\n\n## [1.1.1] - 2026-11-02\n\n- Second\n\n", 1))
            self._publish(project, log, info, "beta", 2)
            version, entry = self._publish(project, log, info, "release", 3)
            self.assertEqual(version, "2.0.0")
            self.assertIn("First", entry)

    def test_old_registry_entry_without_release_field_falls_back_to_last_published(self):
        rel = publisher.release
        info = {"project_id": "1", "last_published_version": "1.2.0"}
        for kind in ("release", "beta"):
            self.assertEqual(rel.merge_baseline(kind, info), "1.2.0")
        self.assertEqual(rel.baselines_after("beta", info, "1.2.1"),
                         {"last_release_version": "1.2.0"})
        self.assertEqual(rel.baselines_after("alpha", {"last_release_version": "1.1.0"}, "1.3.0"),
                         {"last_alpha_version": "1.3.0"})
        self.assertEqual(rel.baselines_after("release", info, "2.0.0"),
                         {"last_release_version": "2.0.0"})

    def test_upload_copy_uses_type_prefix_and_no_by_suffix(self):
        rel = publisher.release
        self.assertEqual(rel.upload_name("beta", "Monster-Companions", ".mcaddon", "default", "1.2.5"), "Beta - Monster Companions v(1.2.5).mcaddon")
        self.assertEqual(rel.upload_name("release", "Mining-Helmet", ".mcaddon", "default", "2.0.0"), "Release - Mining Helmet v(2.0.0).mcaddon")
        
        with tempfile.TemporaryDirectory() as temp:
            src = Path(temp) / "Pack by ALNStudios (V1.2.3).mcaddon"
            src.write_bytes(b"x")
            with patch.dict(os.environ, {"RUNNER_TEMP": temp}):
                staged = rel.stage_upload_copy(src, "beta", "Pack", "default", "1.1.0")
            self.assertEqual(staged.name, "Beta - Pack v(1.1.0).mcaddon")
            self.assertEqual(staged.read_bytes(), b"x")

    def test_legacy_four_part_version_mapping(self):
        rel = publisher.release
        self.assertEqual(rel.parse_version("1.2.3"), (1, 2, 3))
        self.assertEqual(rel.parse_version("1.2.3.4"), (1, 3, 4))
        self.assertEqual(rel.next_version((1, 2, 3), "beta"), "1.3.0")
        self.assertEqual(rel.next_version((1, 2, 3), "release"), "2.0.0")
        self.assertEqual(rel.prior_version("1.3.4"), "1.3.3")
        self.assertTrue(rel.CHANGELOG_HEADER.fullmatch("## [1.2.3.4] - 2026-11-06"))

    def test_new_version_rules(self):
        nxt = publisher.release.next_version
        self.assertEqual(nxt((1, 3, 5), "beta"), "1.4.0")
        self.assertEqual(nxt((1, 3, 5), "update"), "1.3.6")
        self.assertEqual(nxt((1, 3, 5), "release"), "2.0.0")

    def _history(self, temp):
        return self._project(
            temp, [1, 3, 5],
            "# Changelog \u2014 Demo\n\n---\n\n"
            "## [1.3.5] - 2026-11-01\n\n### Fixed\n- Fix 135\n\n"
            "## [1.3.2] - 2026-10-20\n\n### Added\n- Add 132\n\n"
            "## [1.2.0] - 2026-10-01\n\n### Added\n- Add 120\n\n"
            "## [1.1.0] - 2026-09-01\n\n### Added\n- Add 110\n",
        )

    def test_release_nests_series_inside_one_major_fold(self):
        with tempfile.TemporaryDirectory() as temp:
            project, log = self._history(temp)
            info = {"project_id": "1", "last_published_version": "1.3.0", "last_release_version": "1.0.0"}
            version, entry = self._publish(project, log, info, "release", 4)
            self.assertEqual(version, "2.0.0")
            self.assertEqual(entry.count("v1.x.x (4 updates)"), 1)
            self.assertIn("<h3>v1.x.x (4 updates)</h3><h4>v1.3.x", entry)  # major open, newest series open
            self.assertEqual(entry.count('<div class="spoiler">'), 2)      # 1.2.x and 1.1.x folded
            self.assertTrue(entry.index("v1.x.x") < entry.index("v1.3.x") < entry.index("v1.1.x"))

    def test_html_is_escaped_and_uses_only_supported_tags(self):
        with tempfile.TemporaryDirectory() as temp:
            project, log = self._project(
                temp, [1, 0, 0],
                "# Changelog\n\n---\n\n## [1.0.0] - 2026-10-01\n\n### Added\n- **Tool <b>**: 5 > 3 & more\n",
            )
            _, entry = publisher.release.combine_changelog(
                project, log, None, release_type="release", today=datetime.date(2026, 11, 4)
            )
            self.assertIn("<li><strong>Tool &lt;b&gt;</strong>: 5 &gt; 3 &amp; more</li>", entry)
            import re
            allowed = {"h2", "h3", "h4", "p", "strong", "ul", "li", "div"}
            self.assertLessEqual({t.lower() for t in re.findall(r"</?([a-zA-Z0-9]+)", entry)}, allowed)

    def test_release_with_nothing_new_still_folds_existing_history(self):
        with tempfile.TemporaryDirectory() as temp:
            project, log = self._history(temp)
            info = {"project_id": "1", "last_published_version": "1.3.5", "last_release_version": "1.3.5"}
            version, entry = self._publish(project, log, info, "release", 5)
            self.assertEqual(version, "2.0.0")
            for expected in ("Fix 135", "Add 132", "Add 120", "Add 110"):
                self.assertIn(expected, entry)
            self.assertIn("<h3>v1.x.x (4 updates)</h3>", entry)
            text = log.read_text()
            self.assertIn("## [2.0.0] - 2026-11-05", text)
            self.assertIn("## [1.3.5]", text)  # history kept
            # the empty 2.0.0 marker is not counted as an update on the next fold
            version, entry = self._publish(project, log, info, "beta", 6)
            self.assertEqual(version, "2.1.0.0")
            self.assertIn("v1.x.x (4 updates)", entry)
            self.assertNotIn("v2.0.x", entry)

    def test_plain_style_has_no_html(self):
        with tempfile.TemporaryDirectory() as temp:
            project, log = self._history(temp)
            with patch.dict(os.environ, {"CURSEFORGE_CHANGELOG_STYLE": "plain"}):
                _, entry = publisher.release.combine_changelog(
                    project, log, "1.3.0", release_type="beta",
                    today=datetime.date(2026, 11, 4),
                )
            self.assertNotIn("<div", entry)
            self.assertIn("### v1.3.x (2 updates", entry)
            with patch.dict(os.environ, {"CURSEFORGE_CHANGELOG_STYLE": "plain"}):
                self.assertEqual(publisher.release.changelog_type("beta"), "markdown")

    def test_publish_records_release_version_only_for_releases(self):
        for release_type, expect_release in (("beta", None), ("release", "2.0.0")):
            with tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                (root / "builds").mkdir(parents=True)
                (root / "builds/Curseforge_IDs.json").write_text(
                    '{"MCPEDL/Addons/Example":{"project_id":"5","last_published_version":"1.3.1","last_release_version":"1.3.0"}}'
                )
                package = root / "Example.mcaddon"
                package.touch()
                version = "2.0.0" if release_type == "release" else "1.3.2"

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
