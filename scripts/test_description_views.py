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
        self.dark = bdv.render(self.md, style="dark")
        bdv.set_style("minimal")

    def test_only_supported_html(self):
        self.assertEqual(bdv.check_html(self.html), [])

    def test_content_and_no_github_look(self):
        self.assertIn("Demo Pack", self.html)
        self.assertEqual(self.html.count("What You Get"), 1)
        self.assertNotIn("shields.io", self.html)
        self.assertNotIn("Verification", self.html)
        self.assertNotIn("Tested", self.html)

    def test_hero_has_three_badges(self):
        for label in ("Bedrock:", "Experimental:", "Achievements:"):
            self.assertEqual(self.html.count(label), 1)

    def test_kofi_image_link_once(self):
        self.assertEqual(self.html.count("https://ko-fi.com/alnstudios"), 2)  # image link + text link
        self.assertEqual(self.html.count("assets/Images/ko-fi.png"), 1)
        self.assertLess(self.html.index("ko-fi.png"), self.html.index("Permissions and credits"))

    def test_only_one_fill_color(self):
        import re
        md = self.md.replace("## Compatibility", "## Commands\n\n- `/x 1`: Does x.\n\n## Compatibility", 1)
        h = bdv.render(md, "Demo-Pack")
        self.assertEqual(set(re.findall(r"background-color:(#[0-9a-fA-F]{6})", h)), {bdv.ACCENT})

    def test_one_accent_for_every_pack(self):
        self.assertEqual({bdv.accent_for(n) for n in ("Cheat-Stick", "Grand-Banquets", "Universal-Leash", "OP-Sponge")}, {"#15803d"})
        for bad in ("#fbbf24", "#b83a3a", "#b7791f", "#1f8a4c"):
            self.assertNotIn(bad, bdv.render(self.md, "Cheat-Stick", min_version="1.26+"))

    def test_icon_and_no_changelog_box(self):
        log = "# Changelog\n\n## [1.14.5] - 2026-11-12\n\n### Added\n- **Mob light**: Works.\n\n## [1.0.0] - 2026-01-01\n- Old.\n"
        u = bdv.latest_update(log)
        self.assertEqual((u["version"], u["date"], len(u["bullets"])), ("1.14.5", "2026-11-12", 1))
        h = bdv.render(self.md, "Demo-Pack", "https://raw.githubusercontent.com/x/y/main/icon.png", u)
        self.assertNotIn("LATEST UPDATE", h)
        self.assertNotIn("1.14.5", h)
        self.assertIn('width="72"', h)
        self.assertEqual(bdv.check_html(h), [])

    def test_badges_min_version_and_experimental_always_no(self):
        h = bdv.render(self.md, "Demo-Pack", min_version="1.26+")
        self.assertIn("Bedrock: 1.26+", h)
        self.assertIn("Experimental: No", h)
        self.assertEqual(h.count("Experimental:"), 1)

    def test_find_min_version_takes_lowest(self):
        import json
        with tempfile.TemporaryDirectory() as d:
            pack = Path(d)
            for sub, v in (("bp", [1, 26, 0]), ("rp", [1, 21, 40])):
                (pack / sub).mkdir()
                (pack / sub / "manifest.json").write_text(json.dumps({"header": {"min_engine_version": v}}))
            self.assertEqual(bdv.find_min_version(pack), "1.21+")
            self.assertEqual(bdv.find_min_version(Path(d) / "nothing"), "")

    def test_commands_get_their_own_display(self):
        md = self.md.replace("## Compatibility", "## Commands\n\n- `/givemelight 5`: Gives 5 Cursor Lights.\n- `/lightoff`: Turns the light off.\n\n## Compatibility", 1)
        h = bdv.render(md)
        self.assertEqual(h.count(">Commands</h2>"), 1)
        self.assertIn("<code>/givemelight 5</code>", h)
        self.assertIn("Commands need cheats enabled", h)
        self.assertEqual(bdv.check_html(h), [])
        self.assertNotIn(">Commands</h2>", bdv.render(self.md))

    def test_minimal_follows_reader_theme(self):
        h = bdv.render(self.md, "Demo-Pack", style="minimal")
        self.assertEqual(bdv.check_html(h), [])
        for bad in ("#12161c", "#1b222c", "#dfe5ec", 'style=""', "color:;", ";;"):
            self.assertNotIn(bad, h)
        self.assertIn("ko-fi.png", h)
        self.assertIn("aspect-ratio", h)  # step badges still use the accent fill
        self.assertNotIn("Experimental toggles listed", h)
        self.assertIn("#12161c", bdv.render(self.md, style="dark"))  # dark still exists, but is not published
        self.assertEqual(bdv.STYLES, ("minimal",))

    def test_captions_come_from_file_names(self):
        self.assertEqual(bdv.caption_from("01-Cursor-Light_in_a_cave.gif"), "Cursor Light in a cave")
        self.assertEqual(bdv.caption_from("Recipe_Mining-Helmet.png"), "Recipe Mining Helmet")
        self.assertEqual(bdv.caption_from("12.png"), "12")

    def test_media_sections_and_dedupe(self):
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            pack = root / "MCPEDL" / "Addons" / "Demo-Pack"
            for sub, names in (("snapshots", ["10-Late.png", "2-Early.gif"]), ("recipes", ["Helmet-recipe.png", "Used.png"]),
                               ("items", ["Mining-Helmet.png"])):
                (pack / "assets" / sub).mkdir(parents=True)
                for n in names:
                    (pack / "assets" / sub / n).write_bytes(b"x")
            (pack / "assets" / "snapshots" / "notes.txt").write_text("ignore")
            m = bdv.find_media(root, pack, "already ![x](u/Used.png)")
            self.assertEqual([c for _, c in m["snapshots"]], ["Early", "Late"])  # natural order, .txt ignored
            self.assertEqual([c for _, c in m["recipes"]], ["Helmet recipe"])      # Used.png is in DESCRIPTION.md
            for st in bdv.STYLES:
                h = bdv.render(self.md, "Demo-Pack", style=st, media=m)
                self.assertEqual(bdv.check_html(h), [])
                for title in ("Screenshots", "Custom Items", "Crafting Recipes"):
                    self.assertEqual(h.count(f">{title}</h2>"), 1)
                self.assertIn("raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/Addons/Demo-Pack/assets/snapshots/2-Early.gif", h)
            self.assertNotIn("Screenshots", bdv.render(self.md, "Demo-Pack"))

    def test_byline_sits_under_the_title(self):
        for st in bdv.STYLES:
            h = bdv.render(self.md, "Demo-Pack", style=st)
            self.assertEqual(h.count("by ALNStudios"), 1)
            self.assertLess(h.index("</h1>"), h.index("by ALNStudios"))
            self.assertEqual(bdv.check_html(h), [])
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
