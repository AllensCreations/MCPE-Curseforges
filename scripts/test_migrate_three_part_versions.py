#!/usr/bin/env python3
"""Regression tests for the one-time Release.Alpha.Beta.Update migration."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import migrate_three_part_versions as migration

class MigrationTests(unittest.TestCase):
    def test_legacy_version_component_mapping(self):
        self.assertEqual(migration.migrate_version("1.2.3.4"), "1.3.4")
        self.assertEqual(migration.migrate_version("1.2.3"), "1.3.0")
        with self.assertRaises(ValueError):
            migration.migrate_version("1.2")

    def test_project_target_uses_mapped_metadata_and_changelog(self):
        with tempfile.TemporaryDirectory() as temp:
            project = Path(temp)
            manifest = project / "behavior_pack" / "manifest.json"
            manifest.parent.mkdir()
            manifest.write_text(json.dumps({
                "header": {"version": [1, 2, 3]},
                "metadata": {"version": "1.2.3.4"},
            }), encoding="utf-8")
            changelog = project / "CHANGELOG.md"
            changelog.write_text("# Changelog\n\n## [1.2.3.4] - 2026-01-01\n\n- Test\n", encoding="utf-8")
            self.assertEqual(migration.project_target(project), [1, 3, 4])

    def test_changelog_migration_merges_alpha_collision(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "CHANGELOG.md"
            path.write_text(
                "# Changelog\n---\n\n"
                "## [1.2.3.4] - 2026-01-02\n\n### Fixed\n- First\n\n"
                "## [1.9.3.4] - 2026-01-01\n\n### Added\n- Second\n",
                encoding="utf-8",
            )
            self.assertTrue(migration.migrate_changelog(path))
            result = path.read_text(encoding="utf-8")
            self.assertEqual(result.count("## [1.3.4]"), 1)
            self.assertIn("- First", result)
            self.assertIn("- Second", result)

    def test_registry_migration_drops_alpha_and_maps_both_legacy_shapes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "builds").mkdir()
            registry = root / "builds" / "Curseforge_IDs.json"
            registry.write_text(json.dumps({
                "MCPEDL/Addons/Demo": {
                    "project_id": "42",
                    "last_published_version": "1.2.3.4",
                    "last_release_version": "1.2.3",
                    "last_alpha_version": "1.9.3.4",
                }
            }), encoding="utf-8")
            with patch.object(migration, "ROOT", root):
                self.assertTrue(migration.migrate_registry())
            saved = json.loads(registry.read_text(encoding="utf-8"))["MCPEDL/Addons/Demo"]
            self.assertEqual(saved["last_published_version"], "1.3.4")
            self.assertEqual(saved["last_release_version"], "1.3.0")
            self.assertNotIn("last_alpha_version", saved)

    def test_legacy_per_pack_registry_files_are_migrated(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            info_dir = root / "builds" / "Demo"
            info_dir.mkdir(parents=True)
            info = info_dir / "Curseforge_Info.json"
            info.write_text(json.dumps({
                "project_id": "42",
                "last_published_version": "1.2.3.4",
                "last_release_version": "1.2.3",
                "last_alpha_version": "1.9.3.4",
            }), encoding="utf-8")
            with patch.object(migration, "ROOT", root):
                changed = migration.migrate_legacy_info_files()
            self.assertEqual(len(changed), 1)
            saved = json.loads(info.read_text(encoding="utf-8"))
            self.assertEqual(saved["last_published_version"], "1.3.4")
            self.assertEqual(saved["last_release_version"], "1.3.0")
            self.assertNotIn("last_alpha_version", saved)

    def test_old_snapshots_are_archived_out_of_active_version_tree(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            versions = root / "builds" / "Demo" / "versions"
            (versions / "V1.2.3").mkdir(parents=True)
            (versions / "V1.2.3.4").mkdir()
            with patch.object(migration, "ROOT", root):
                changed = migration.archive_old_snapshots()
            self.assertEqual(len(changed), 2)
            self.assertFalse((versions / "V1.2.3").exists())
            self.assertTrue((versions.parent / "legacy_versions" / "V1.2.3").is_dir())
            self.assertTrue((versions.parent / "legacy_versions" / "V1.2.3.4").is_dir())

if __name__ == "__main__":
    unittest.main(verbosity=2)
