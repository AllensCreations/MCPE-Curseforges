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
            (root / "builds/Example").mkdir(parents=True)
            (root / "builds/Example/Curseforge_Info.json").write_text('{"project_id":"123"}')
            with patch.object(publisher.release, "REPO_ROOT", root):
                with patch.dict(os.environ, {"CURSEFORGE_API_TOKEN": ""}):
                    with self.assertRaisesRegex(ValueError, "CURSEFORGE_API_TOKEN"):
                        publisher.publish("MCPEDL/Addons/Example")

    def test_map_all_uploads_each_variant_and_bumps_only_once(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "builds/Example").mkdir(parents=True)
            (root / "builds/Example/Curseforge_Info.json").write_text('{"project_id":"123"}')
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
            saved = json.loads((root / "builds/Example/Curseforge_Info.json").read_text())
            self.assertEqual(saved["last_published_version"], "1.1.0")

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


if __name__ == "__main__":
    unittest.main()
