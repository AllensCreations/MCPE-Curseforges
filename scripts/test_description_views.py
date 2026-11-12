#!/usr/bin/env python3
"""Description views: valid CurseForge HTML from a template-compliant DESCRIPTION.md."""
import tempfile
import unittest
from pathlib import Path

import build_description_views as bdv
import doc_template as dt


class DescriptionViewTests(unittest.TestCase):
    def setUp(self):
        self.md = dt.compliant_docs("addon", "Demo Pack", "1.0.0")["DESCRIPTION.md"]
        self.html = bdv.render(self.md)

    def test_only_supported_html(self):
        self.assertEqual(bdv.check_html(self.html), [])

    def test_content_and_no_github_look(self):
        self.assertIn("Demo Pack", self.html)
        self.assertEqual(self.html.count("What You Get"), 1)
        self.assertNotIn("shields.io", self.html)
        self.assertNotIn("Verification", self.html)
        self.assertNotIn("Tested", self.html)

    def test_compat_has_three_rows(self):
        self.assertEqual(self.html.count("<tr>"), 3)

    def test_other_title_styles_still_build(self):
        body = "\n## Overview\n\nText.\n"
        for title, want in (("# Grimoire Relics V2", "Grimoire Relics V2"),
                            ("# Monster Companions - Tame mobs", "Monster Companions"),
                            ("# Vanilla QoL \u2013 Small fixes (v1.2.0)", "Vanilla QoL"),
                            ("# Passive Tools: Auto switch", "Passive Tools"),
                            ("No title here", "Dirtbound Kingdom Beta")):
            h = bdv.render(title + body, "Dirtbound-Kingdom-Beta")
            self.assertIn(want, h)
            self.assertEqual(bdv.check_html(h), [])

    def test_unsupported_html_is_caught(self):
        self.assertTrue(bdv.check_html("<script>x</script>"))
        self.assertTrue(bdv.check_html('<p style="padding:4px">x</p>'))
        self.assertTrue(bdv.check_html('<p style="font-size:60px">x</p>'))

    def test_build_and_check_roundtrip(self):
        with tempfile.TemporaryDirectory() as d:
            pack = Path(d) / "MCPEDL" / "Addons" / "Demo-Pack"
            pack.mkdir(parents=True)
            (pack / "DESCRIPTION.md").write_text(self.md, encoding="utf-8")
            self.assertEqual(bdv.main(["--root", d, "--all"]), 0)
            self.assertEqual(bdv.main(["--root", d, "--all", "--check"]), 0)
            (Path(d) / "description_views" / "Demo-Pack.curseforge.html").write_text("old", encoding="utf-8")
            self.assertEqual(bdv.main(["--root", d, "--all", "--check"]), 1)


if __name__ == "__main__":
    unittest.main()
