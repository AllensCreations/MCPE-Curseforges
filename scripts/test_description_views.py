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

    def test_compat_has_three_badges(self):
        for label in ("Bedrock:", "Experimental:", "Achievements:"):
            self.assertEqual(self.html.count(label), 1)

    def test_kofi_image_link_once(self):
        self.assertEqual(self.html.count("https://ko-fi.com/alnstudios"), 2)  # image link + text link
        self.assertEqual(self.html.count("assets/Images/ko-fi.png"), 1)
        self.assertLess(self.html.index("ko-fi.png"), self.html.index("Permissions and credits"))

    def test_accent_is_stable_and_differs_per_pack(self):
        a1 = bdv.accent_for("Mining-Helmet")
        self.assertEqual(a1, bdv.accent_for("Mining-Helmet"))
        self.assertGreater(len({bdv.accent_for(n) for n in ("Cheat-Stick", "Grand-Banquets", "Universal-Leash", "OP-Sponge")}), 1)

    def test_icon_and_latest_update(self):
        log = "# Changelog\n\n## [1.14.5] - 2026-11-12\n\n### Added\n- **Mob light**: Works.\n\n## [1.0.0] - 2026-01-01\n- Old.\n"
        u = bdv.latest_update(log)
        self.assertEqual((u["version"], u["date"], len(u["bullets"])), ("1.14.5", "2026-11-12", 1))
        h = bdv.render(self.md, "Demo-Pack", "https://raw.githubusercontent.com/x/y/main/icon.png", u)
        self.assertIn("LATEST UPDATE", h)
        self.assertIn('width="72"', h)
        self.assertEqual(bdv.check_html(h), [])

    def test_minimal_follows_reader_theme(self):
        h = bdv.render(self.md, "Demo-Pack", style="minimal")
        self.assertEqual(bdv.check_html(h), [])
        for bad in ("#12161c", "#1b222c", "#dfe5ec", 'style=""', "color:;", ";;"):
            self.assertNotIn(bad, h)
        self.assertIn("ko-fi.png", h)
        self.assertIn("aspect-ratio", h)  # step badges still use the accent fill
        bdv.render(self.md)  # style resets cleanly
        self.assertIn("#12161c", bdv.render(self.md))

    def test_steps_use_badges(self):
        h = bdv.render(self.md.replace("Use the items and interactions provided in the world.", "1. First.\n2. Second."))
        self.assertIn("aspect-ratio", h)
        self.assertEqual(bdv.check_html(h), [])

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

    def test_common_questions_and_card_extras_are_kept(self):
        md = (self.md.replace("## Compatibility", "## Common Questions\n\n- **Can I turn it off?**: Yes. Set it to Normal.\n\n## Compatibility", 1)
              .replace("- **What Happens**: Players can use feature 1 in the world.",
                       "- **What Happens**: Players can use feature 1 in the world.\n- **Good To Know**: Extra note here.", 1))
        h = bdv.render(md)
        self.assertIn("Common Questions", h)
        self.assertIn("Can I turn it off?", h)
        self.assertIn('class="spoiler"', h)
        self.assertIn("Good To Know:", h)
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
