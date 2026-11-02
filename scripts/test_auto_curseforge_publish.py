#!/usr/bin/env python3
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

    def test_missing_saved_id_skips_without_token_or_build(self):
        with tempfile.TemporaryDirectory() as temp:
            with patch.object(publisher.release, "REPO_ROOT", Path(temp)):
                with patch.dict(os.environ, {"CURSEFORGE_API_TOKEN": ""}):
                    with patch.object(publisher.release, "prepare") as prepare:
                        self.assertFalse(publisher.publish("MCPEDL/Addons/Example"))
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

    def test_map_all_uploads_each_variant_and_builds_only_once(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "builds/Example").mkdir(parents=True)
            (root / "builds/Example/Curseforge_Info.json").write_text('{"project_id":"123"}')
            package = root / "Example.mcworld"
            package.touch()
            prepare_calls = []
            metadata_files = []

            def prepare(project, release_type, map_variant, rebuild):
                prepare_calls.append((map_variant, rebuild))
                metadata = root / f"{map_variant}.json"
                metadata.touch()
                metadata_files.append(metadata)
                return package, metadata, "123", root / "info.json", []

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
                [("Creative", False), ("Survival", False), ("Hardcore", False)],
            )
            self.assertEqual(run.call_count, 3)
            self.assertTrue(all(not path.exists() for path in metadata_files))


if __name__ == "__main__":
    unittest.main()
