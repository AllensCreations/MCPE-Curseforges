#!/usr/bin/env python3
"""Regression tests for the three-part CurseForge publishing policy."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import auto_publish_curseforge as publisher
import prepare_curseforge_upload as release

class VersionPolicyTests(unittest.TestCase):
    def test_versions_are_exactly_three_parts(self):
        self.assertEqual(release.parse_version("1.2.3"), (1, 2, 3))
        with self.assertRaises(ValueError): release.parse_version("1.2.3.4")
        with self.assertRaises(ValueError): release.parse_version("1.2")

    def test_update_beta_release_progression(self):
        self.assertEqual(release.next_version((1, 2, 3), "update"), "1.2.4")
        self.assertEqual(release.next_version((1, 2, 3), "beta"), "1.3.0")
        self.assertEqual(release.next_version((1, 3, 0), "release"), "2.0.0")

    def test_release_baselines_have_no_alpha_state(self):
        self.assertEqual(release.baselines_after("beta", {"last_published_version": "1.2.3"}, "1.3.0"), {"last_release_version": "1.2.3"})
        self.assertEqual(release.baselines_after("release", {}, "2.0.0"), {"last_release_version": "2.0.0"})
        self.assertEqual(release.merge_baseline("beta", {"last_published_version": "1.2.3", "last_release_version": "1.1.0"}), "1.2.3")
        self.assertEqual(release.merge_baseline("release", {"last_published_version": "1.3.0", "last_release_version": "1.1.0"}), "1.1.0")

    def test_changelog_header_rejects_four_part_versions(self):
        self.assertTrue(release.CHANGELOG_HEADER.fullmatch("## [1.2.3] - 2026-11-11"))
        self.assertFalse(release.CHANGELOG_HEADER.fullmatch("## [1.2.3.4] - 2026-11-11"))

    def test_alpha_is_not_a_publish_choice(self):
        self.assertNotIn("alpha", ("beta", "release"))
        with self.assertRaises(ValueError):
            release.prepare("MCPEDL/Addons/Example", "alpha")

    def test_registry_migration_drops_alpha_and_truncates_old_versions(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "builds").mkdir()
            registry = root / "builds/Curseforge_IDs.json"
            registry.write_text(json.dumps({"MCPEDL/Addons/Demo": {"project_id": "42", "last_published_version": "1.2.3.4", "last_release_version": "1.0.0.0", "last_alpha_version": "1.2.3.4"}}))
            with patch.object(release, "REPO_ROOT", root):
                release.save_info("MCPEDL/Addons/Demo", "42", "1.2.4", last_release_version="1.0.0")
            saved = json.loads(registry.read_text())["MCPEDL/Addons/Demo"]
            self.assertEqual(saved["last_published_version"], "1.2.4")
            self.assertNotIn("last_alpha_version", saved)

if __name__ == "__main__": unittest.main()
