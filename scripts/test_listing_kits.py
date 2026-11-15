#!/usr/bin/env python3
"""Listing kits: name, summary (max 256), description HTML and image prompts, each in a copyable block."""
import re
import tempfile
import unittest
from pathlib import Path

import build_listing_kits as blk
import doc_template as dt


class ListingKitTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.pack = self.root / "MCPEDL/Addons/Demo-Pack"
        self.pack.mkdir(parents=True)
        self.md = dt.compliant_docs("addon", "Demo Pack", "1.0.0")["DESCRIPTION.md"]
        (self.pack / "DESCRIPTION.md").write_text(self.md, encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def kit(self):
        self.assertEqual(blk.main(["--all", "--root", str(self.root)]), 0)
        return (self.root / "description_views/Demo-Pack.listing.md").read_text(encoding="utf-8")

    def test_every_part_is_in_a_copy_block(self):
        k = self.kit()
        for h in ("## Package Name", "## Summary (", "## Description (HTML)", "### Logo Prompt", "### Banner Prompt"):
            self.assertIn(h, k)
        self.assertIn("```text\nDemo Pack\n```", k)
        self.assertEqual(k.count("```text"), 4)
        self.assertIn("```html", k)
        self.assertNotIn("<script", k)

    def test_summary_is_at_most_256(self):
        m = re.search(r"## Summary \((\d+)/256\)\n\n```text\n(.*?)\n```", self.kit(), re.S)
        self.assertLessEqual(int(m.group(1)), 256)
        self.assertEqual(len(m.group(2)), int(m.group(1)))
        long = "Sentence one is fine. " + "word " * 80
        self.assertLessEqual(len(blk.make_summary(long)), 256)
        self.assertLessEqual(len(blk.make_summary("x" * 400)), 256)
        self.assertEqual(blk.make_summary("**A `short` [line](http://x.y)**"), "A short line")

    def test_fence_is_longer_than_any_backtick_run(self):
        self.assertEqual(blk.fence_for("a ```` b"), "`" * 5)

    def test_check_detects_stale_and_missing(self):
        self.assertEqual(blk.main(["--all", "--check", "--root", str(self.root)]), 1)
        self.kit()
        self.assertEqual(blk.main(["--all", "--check", "--root", str(self.root)]), 0)
        (self.root / "description_views/Demo-Pack.listing.md").write_text("old", encoding="utf-8")
        self.assertEqual(blk.main(["--all", "--check", "--root", str(self.root)]), 1)


if __name__ == "__main__":
    unittest.main()
