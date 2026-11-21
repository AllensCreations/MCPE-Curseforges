#!/usr/bin/env python3
"""Catalog version column: reads ## [vN] and ## [X.Y.Z] headings, falls back to the manifest, flags mismatches."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_mcpedl_readme as b


def project(tmp, changelog, manifest=None):
    p = Path(tmp) / "Addons" / "Demo"
    (p / "behavior_pack").mkdir(parents=True)
    if changelog is not None:
        (p / "CHANGELOG.md").write_text(changelog, encoding="utf-8")
    if manifest:
        (p / "behavior_pack" / "manifest.json").write_text(json.dumps({"header": {"version": manifest}}), encoding="utf-8")
    return p


class Versions(unittest.TestCase):
    def test_bare_and_dotted_headings(self):
        with tempfile.TemporaryDirectory() as t:
            self.assertEqual(b.pack_version(project(t, "# C\n\n## [v6] - 2026\n\n## [v5]\n")), "v6")
        with tempfile.TemporaryDirectory() as t:
            self.assertEqual(b.pack_version(project(t, "## [14.0.1] - x\n")), "14.0.1")
        with tempfile.TemporaryDirectory() as t:
            self.assertEqual(b.pack_version(project(t, "## [v2.1.0] - x\n")), "2.1.0")

    def test_manifest_fallback(self):
        with tempfile.TemporaryDirectory() as t:
            self.assertEqual(b.pack_version(project(t, None, [3, 0, 0])), "v3")
        with tempfile.TemporaryDirectory() as t:
            self.assertEqual(b.pack_version(project(t, "no headings", None)), "-")

    def test_mismatch_warning(self):
        with tempfile.TemporaryDirectory() as t:
            self.assertIsNone(b.version_mismatch(project(t, "## [v6]\n", [6, 0, 0])))
        with tempfile.TemporaryDirectory() as t:
            self.assertIn("mismatch", b.version_mismatch(project(t, "## [v7]\n", [6, 0, 0])))


if __name__ == "__main__":
    unittest.main()
