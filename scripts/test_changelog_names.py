#!/usr/bin/env python3
"""Changelog entry Names: accepted everywhere, optional on old entries, kept when grouped."""
import datetime
import tempfile
import unittest
from pathlib import Path

import build_changelog_views as views
import doc_template as dt
import migrate_three_part_versions as migrate
import prepare_curseforge_upload as release

NAMED = (
    "# Changelog \u2014 Demo\n\n---\n\n"
    "## [1.2.2] - 2026-11-05 - Faster Mining\n\n### Added\n- **A**: add two\n\n"
    "## [1.2.1] - 2026-11-01\n\n### Fixed\n- **B**: fix one\n\n"
    "## [1.1.0] - 2026-10-01 - First Release\n\n### Added\n- **C**: old\n"
)


class ChangelogNameTests(unittest.TestCase):
    def test_validator_accepts_named_and_unnamed_entries(self):
        errors = []
        dt.check_changelog(NAMED, "1.2.2", errors)
        self.assertEqual(errors, [])

    def test_views_show_the_name(self):
        _, releases = views.parse(NAMED)
        self.assertEqual([r["name"] for r in releases], ["Faster Mining", "", "First Release"])
        self.assertIn("[1.2.2] - 2026-11-05 - Faster Mining", views.build_github("Demo", releases, 1))
        self.assertIn("1.2.2 - 2026-11-05 - Faster Mining", views.build_curseforge("Demo", releases, 1))

    def test_migration_keeps_names(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "CHANGELOG.md"
            path.write_text(NAMED, encoding="utf-8")
            migrate.migrate_changelog(path)
            self.assertIn("- Faster Mining", path.read_text(encoding="utf-8"))

    def test_grouped_publish_lists_names_and_keeps_remaining_names(self):
        with tempfile.TemporaryDirectory() as temp:
            project = Path(temp)
            changelog = project / "CHANGELOG.md"
            changelog.write_text(NAMED, encoding="utf-8")
            version, upload = release.combine_changelog(
                project, changelog, "1.1.0", today=datetime.date(2026, 11, 12), release_type="keep")
            saved = changelog.read_text(encoding="utf-8")
        self.assertEqual(version, "1.2.2")
        self.assertIn("Includes: Faster Mining.", upload)
        self.assertIn("## [1.1.0] - 2026-10-01 - First Release", saved)


if __name__ == "__main__":
    unittest.main()
