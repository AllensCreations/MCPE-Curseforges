#!/usr/bin/env python3
"""Regression tests for automatic X.Y.Z Update bump decisions."""

import unittest

import auto_bump_and_build as builder


class AutomaticBumpDecisionTests(unittest.TestCase):
    def test_source_hash_change_bumps(self):
        self.assertTrue(builder.should_bump_project("source_changed"))

    def test_missing_snapshot_bumps_when_git_diff_proves_source_change(self):
        self.assertTrue(builder.should_bump_project("missing", source_changed_in_diff=True))

    def test_legacy_snapshot_bumps_when_git_diff_proves_source_change(self):
        self.assertTrue(builder.should_bump_project("legacy", source_changed_in_diff=True))

    def test_missing_snapshot_without_source_diff_does_not_bump(self):
        self.assertFalse(builder.should_bump_project("missing"))

    def test_legacy_snapshot_without_source_diff_does_not_bump(self):
        self.assertFalse(builder.should_bump_project("legacy"))

    def test_unchanged_source_does_not_bump(self):
        self.assertFalse(builder.should_bump_project("current", source_changed_in_diff=True))

    def test_package_drift_does_not_bump(self):
        self.assertFalse(builder.should_bump_project("packages_stale", source_changed_in_diff=True))

    def test_new_project_keeps_its_initial_version(self):
        self.assertFalse(builder.should_bump_project("missing", source_changed_in_diff=True, is_new=True))

    def test_only_three_part_patch_increment_is_used(self):
        self.assertEqual(builder.manifest_tools.bump_patch([1, 2, 9]), [1, 2, 10])


if __name__ == "__main__":
    unittest.main()
