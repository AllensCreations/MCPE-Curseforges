#!/usr/bin/env python3
"""Whole-repo runner: every lint rule and the log analyzer, against small throwaway projects."""
import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
import run_repo_tests as rrt  # noqa: E402

MANIFEST = {
    "format_version": 2,
    "header": {"name": "Demo", "uuid": "00000000-0000-4000-8000-000000000001", "version": [1, 0, 0]},
    "modules": [{"type": "script", "language": "javascript", "uuid": "00000000-0000-4000-8000-000000000002",
                 "version": [1, 0, 0], "entry": "scripts/main.js"}],
    "metadata": {"authors": ["ALNStudios"], "product_type": "addon"},
}


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text if isinstance(text, str) else json.dumps(text), encoding="utf-8")


def rules(findings, level):
    return {i["rule"] for i in findings.items if i["level"] == level}


class ContentLintTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.project = self.root / "MCPEDL" / "Addons" / "Demo"
        self.bp = self.project / "behavior_pack"
        self.rp = self.project / "resource_pack"

    def tearDown(self):
        self.tmp.cleanup()

    def lint(self):
        return rrt.stage_content(self.root, None, set())

    def good_project(self):
        write(self.bp / "manifest.json", MANIFEST)
        write(self.bp / "scripts" / "main.js", "import { world } from '@minecraft/server';\nworld.afterEvents.itemUse.subscribe(() => {});\n")

    def test_content_baseline_hides_known_and_shows_new(self):
        self.good_project()
        write(self.bp / "functions" / "a.mcfunction", "# note\nsay hi\n")
        base = self.root / "base.json"
        first = rrt.stage_content(self.root, None, set(), None, base)
        self.assertIn("F-COMMENT", rules(first, "FAIL"))
        second = rrt.stage_content(self.root, None, set(), base, None)
        self.assertEqual(second.count("FAIL"), 0, second.items)
        self.assertIn("F-COMMENT", rules(second, "INFO"))
        write(self.bp / "functions" / "b.mcfunction", "# another\nsay hi\n")
        third = rrt.stage_content(self.root, None, set(), base, None)
        self.assertEqual([i["where"] for i in third.items if i["level"] == "FAIL"],
                         ["MCPEDL/Addons/Demo/behavior_pack/functions/b.mcfunction"])

    def test_baseline_file_keeps_both_sections(self):
        self.good_project()
        write(self.bp / "functions" / "a.mcfunction", "# note\n")
        base = self.root / "base.json"
        rrt.stage_content(self.root, None, set(), None, base)
        rrt.write_baseline_section(base, "logs", {"L-X|y"})
        data = json.loads(base.read_text())
        self.assertTrue(data["content"] and data["logs"] == ["L-X|y"])

    def test_clean_project_has_no_failures(self):
        self.good_project()
        f = self.lint()
        self.assertEqual(f.count("FAIL"), 0, f.items)

    def test_manifest_metadata_and_entry(self):
        bad = dict(MANIFEST, metadata={"authors": ["Someone"]})
        write(self.bp / "manifest.json", bad)
        f = self.lint()
        self.assertIn("M-META", rules(f, "FAIL"))
        self.assertIn("M-ENTRY", rules(f, "FAIL"))

    def test_recipe_without_item_or_tag(self):
        self.good_project()
        write(self.bp / "recipes" / "x.json", {"format_version": "1.12", "minecraft:recipe_shapeless": {
            "description": {"identifier": "allenscreations:x"}, "tags": ["crafting_table"],
            "ingredients": [{"data": 0}], "result": {"item": "minecraft:dirt"}}})
        self.assertIn("R-ING", rules(self.lint(), "FAIL"))

    def test_recipe_malformed_name_and_pattern_key(self):
        self.good_project()
        write(self.bp / "recipes" / "y.json", {"format_version": "1.12", "minecraft:recipe_shaped": {
            "description": {"identifier": "allenscreations:y"}, "tags": ["crafting_table"],
            "pattern": ["AB"], "key": {"A": {"item": "dirt"}}, "result": {"item": "minecraft:dirt"}}})
        f = self.lint()
        self.assertIn("R-ING", rules(f, "FAIL"))
        self.assertIn("R-KEY", rules(f, "FAIL"))

    def test_recipe_unknown_vanilla_and_custom(self):
        self.good_project()
        ref = self.root / "reference" / "bedrock-samples"
        ref.mkdir(parents=True)
        import gzip
        with gzip.open(ref / "bedrock-samples.min.json.gz", "wt", encoding="utf-8") as fh:
            fh.write('{"a": "minecraft:dirt"}')
        write(self.bp / "recipes" / "z.json", {"format_version": "1.12", "minecraft:recipe_shapeless": {
            "description": {"identifier": "allenscreations:z"}, "tags": ["crafting_table"],
            "ingredients": [{"item": "minecraft:dirt"}, {"item": "minecraft:not_real"}, {"item": "demo:ghost"}],
            "result": {"item": "minecraft:dirt"}}})
        f = self.lint()
        self.assertIn("R-VANILLA", rules(f, "INFO"))
        self.assertIn("R-CUSTOM", rules(f, "WARN"))

    def test_vanilla_item_override(self):
        self.good_project()
        write(self.bp / "items" / "torch.json", {"format_version": "1.20.30", "minecraft:item": {
            "description": {"identifier": "minecraft:torch"}}})
        self.assertIn("I-OVERRIDE", rules(self.lint(), "FAIL"))

    def test_geometry_comment(self):
        self.good_project()
        write(self.rp / "models" / "entity" / "v.geo.json", {"format_version": "1.12.0", "minecraft:geometry": [
            {"description": {"identifier": "geometry.v"}, "bones": [{"name": "b", "cubes": [{"origin": [0, 0, 0], "comment": "x"}]}]}]})
        self.assertIn("G-COMMENT", rules(self.lint(), "FAIL"))

    def test_tick_function_missing(self):
        self.good_project()
        write(self.bp / "functions" / "tick.json", {"values": ["void_cleaner"]})
        self.assertIn("F-TICK", rules(self.lint(), "FAIL"))
        write(self.bp / "functions" / "void_cleaner.mcfunction", "say hi\n")
        self.assertNotIn("F-TICK", rules(self.lint(), "FAIL"))

    def test_mcfunction_and_json_comments(self):
        self.good_project()
        write(self.bp / "functions" / "a.mcfunction", "# note\nsay hi\n")
        write(self.bp / "loot_tables" / "l.json", '{\n // note\n "pools": []\n}')
        f = self.lint()
        self.assertIn("F-COMMENT", rules(f, "FAIL"))
        self.assertIn("J-COMMENT", rules(f, "FAIL"))

    def test_json_parse_error(self):
        self.good_project()
        write(self.bp / "items" / "broken.json", "{ not json")
        self.assertIn("J-PARSE", rules(self.lint(), "FAIL"))

    def test_unguarded_item_throw_fails_and_guard_passes(self):
        write(self.bp / "manifest.json", MANIFEST)
        write(self.bp / "scripts" / "main.js", "import { world } from '@minecraft/server';\nworld.afterEvents.itemThrow.subscribe(() => {});\n")
        self.assertIn("S-EVENT", rules(self.lint(), "FAIL"))
        write(self.bp / "scripts" / "main.js", "import { world } from '@minecraft/server';\nworld.afterEvents.itemThrow?.subscribe(() => {});\n")
        self.assertNotIn("S-EVENT", rules(self.lint(), "FAIL"))
        write(self.bp / "scripts" / "main.js", "import { world } from '@minecraft/server';\nif (world.afterEvents.itemThrow) {\nworld.afterEvents.itemThrow.subscribe(() => {});\n}\n")
        self.assertNotIn("S-EVENT", rules(self.lint(), "FAIL"))

    def test_unverified_event_is_info_and_events_file_extends(self):
        write(self.bp / "manifest.json", MANIFEST)
        write(self.bp / "scripts" / "main.js", "import { world } from '@minecraft/server';\nworld.afterEvents.entityDie.subscribe(() => {});\n")
        self.assertIn("S-EVENT-UNVERIFIED", rules(self.lint(), "INFO"))
        f = rrt.stage_content(self.root, None, {"entityDie"})
        self.assertNotIn("S-EVENT-UNVERIFIED", rules(f, "INFO"))

    def test_legacy_api_comments_and_loops(self):
        write(self.bp / "manifest.json", MANIFEST)
        write(self.bp / "scripts" / "main.js",
              "import { world } from 'mojang-minecraft';\n// note\nwhile (true) { }\nfor (let i = 0; i < 500000; i++) { }\n"
              "while (true) { if (x) { break; } }\nfor (;;) { return; }\n")
        f = self.lint()
        self.assertEqual(sum(1 for i in f.items if i["rule"] == "S-LOOP" and "while" not in i["msg"] and "unbounded" in i["msg"]), 1)
        self.assertIn("S-LEGACY", rules(f, "FAIL"))
        self.assertIn("S-COMMENT", rules(f, "FAIL"))
        self.assertIn("S-LOOP", rules(f, "WARN"))

    def test_particle_variable_never_set(self):
        self.good_project()
        write(self.rp / "particles" / "p.json", '{"particle_effect": {"curves": {}, "x": "variable.color.r", "y": "variable.particle_age"}}')
        self.assertIn("P-VAR", rules(self.lint(), "WARN"))
        write(self.bp / "scripts" / "main.js", "const m = 1; setColor('variable.color');\n")
        self.assertNotIn("P-VAR", rules(self.lint(), "WARN"))

    def test_comment_finder_ignores_strings_and_regex_quotes(self):
        text = "const u = 'https://x.y';\nconst r = a.replace(/'/g, \"\");\nconst t = `//no`;\n// yes\n/* also\nyes */\n"
        self.assertEqual(rrt.js_comment_lines(text), [4, 5])

    def test_comment_finder_handles_templates_regex_and_division(self):
        text = (
            "const a = `x ${ \"a//b\" } // y ${ `n ${ 1 } //z` }`;\n"
            "const r = /\\/\\/|\"[/]/.test(s) ? 1 : 2;\n"
            "const d = a / b / c;\n"
            "const u = 'it\\'s // fine';\n"
            "return /abc/g.test(x); // real\n"
        )
        self.assertEqual(rrt.js_comment_lines(text), [5])

    def test_loop_with_break_or_return_is_fine_without_is_warned(self):
        masked_ok = "while (true) { const r = 1; if (r) break; }"
        masked_bad = "while (true) { const r = 1; }"
        self.assertIn("break", rrt.loop_body(masked_ok, len("while (true)")))
        self.assertNotIn("break", rrt.loop_body(masked_bad, len("while (true)")))


class LogTests(unittest.TestCase):
    LOG = (
        "10:54:05[Recipes][error]-recipes/beast_biscuit.json | allenscreations:beast_biscuit_recipe | Recipe ingredient is invalid: Must contain either a valid item name or item tag\r\n"
        "10:54:14[Sound][verbose]-No sound found for block type 'normal' and event type 'fly'\r\n"
        "00:07:34[Scripting][error]-[Watchdog] 424448 ms hang detected in 'Combat Helper (v16)'\r\n"
        "02:20:14[Scripting][error]-[Pack (v2)] TypeError: cannot read property 'subscribe' of undefined    at <anonymous> (main.js:446)\r\n"
        "11:20:14[Scripting][warning]-[OBM][INFO] Core placed: minecraft:dirt\r\n"
        "11:20:15[Scripting][warning]-[OBM][WARN] itemThrow event is not available in this API version\r\n"
        "11:20:16[Item][error]-Item 'minecraft:torch' (format_version: 1.20.30) cannot be registered because no 1.16.100+ Vanilla format version exists!\r\n"
        "11:20:17[Geometry][error]-models/entity/xray_visor.geo.json | minecraft:geometry | bones | cubes | comment | child 'comment' not valid here.\r\n"
        "11:20:18[Commands][warning]-Function listed in tick.json with name void_cleaner not found.\r\n"
        "11:20:19[Molang][error]-Error: unhandled request for unknown variable '.r'\r\n"
        "11:20:20[UI][error]-UI Control: long_form | UI Control: panel_indent\r\n"
    )

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        (self.dir / "ContentLog2026-11-19_10-53-35_1.txt").write_text(self.LOG, encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def test_directory_classification(self):
        f = rrt.stage_logs(self.dir, None, None)
        self.assertEqual(rules(f, "FAIL"), {"L-RECIPE", "L-HANG", "L-SCRIPT", "L-ITEM", "L-GEO", "L-FUNC", "L-MOLANG", "L-UI"})
        self.assertEqual(rules(f, "WARN"), {"L-WARN"})

    def test_zip_input_matches_directory(self):
        z = self.dir / "logs.zip"
        with zipfile.ZipFile(z, "w") as zf:
            zf.write(self.dir / "ContentLog2026-11-19_10-53-35_1.txt", "ContentLog2026-11-19_10-53-35_1.txt")
        a = rrt.stage_logs(z, None, None)
        b = rrt.stage_logs(self.dir, None, None)
        self.assertEqual(rules(a, "FAIL"), rules(b, "FAIL"))

    def test_baseline_hides_known_problems(self):
        base = self.dir / "base.json"
        rrt.stage_logs(self.dir, None, base)
        f = rrt.stage_logs(self.dir, base, None)
        self.assertEqual(f.count("FAIL"), 0)
        self.assertEqual(f.count("WARN"), 0)

    def test_ignore_regex_drops_third_party_lines(self):
        f = rrt.stage_logs(self.dir, None, None, [r"Combat Helper", r"recipes/beast"])
        self.assertNotIn("L-HANG", rules(f, "FAIL"))
        self.assertNotIn("L-RECIPE", rules(f, "FAIL"))
        self.assertIn("L-ITEM", rules(f, "FAIL"))

    def test_no_logs_fails(self):
        empty = self.dir / "empty"
        empty.mkdir()
        self.assertIn("L-NOLOGS", rules(rrt.stage_logs(empty, None, None), "FAIL"))


class RunnerTests(unittest.TestCase):
    def test_tools_stage_detects_failure_hang_and_ci_gaps(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "scripts").mkdir()
            (root / ".github" / "workflows").mkdir(parents=True)
            write(root / "scripts" / "test_ok.py", "print('ok')\n")
            write(root / "scripts" / "test_bad.py", "import sys\nsys.exit(3)\n")
            write(root / "scripts" / "test_slow.py", "import time\ntime.sleep(30)\n")
            write(root / "scripts" / "test_unlisted.py", "print('ok')\n")
            write(root / "scripts" / "broken_syntax.py", "def (:\n")
            write(root / "scripts" / "helper.py", "x = 1\n")
            write(root / ".github" / "workflows" / "ci.yml",
                  "run: python scripts/test_ok.py\nrun: python scripts/test_bad.py\nrun: python scripts/test_slow.py\n"
                  "run: python scripts/test_gone.py\n")
            f = rrt.stage_tools(root, 4, 2, False)
            self.assertEqual(rules(f, "FAIL"), {"T-RUN", "T-HANG", "T-SYNTAX", "T-CI-STALE"})
            self.assertIn("T-CI-MISSING", rules(f, "WARN"))
            self.assertIn("T-NOTEST", rules(f, "INFO"))

    def test_tools_stage_prints_progress_heartbeat_and_match_filter(self):
        import contextlib
        import io
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "scripts").mkdir()
            write(root / "scripts" / "test_fast.py", "print('ok')\n")
            write(root / "scripts" / "test_slowish.py", "import time\ntime.sleep(1.5)\n")
            old = rrt.HEARTBEAT
            rrt.HEARTBEAT = 0.4
            buf = io.StringIO()
            try:
                with contextlib.redirect_stdout(buf):
                    f = rrt.stage_tools(root, 2, 20, False)
                    only = rrt.stage_tools(root, 2, 20, False, ["fast"])
            finally:
                rrt.HEARTBEAT = old
            text = buf.getvalue()
            self.assertIn("[1/2]", text)
            self.assertIn("still running: test_slowish.py", text)
            self.assertEqual(f.count("FAIL"), 0, f.items)
            self.assertEqual([i["where"] for i in only.items if i["rule"] == "T-RUN"], ["scripts/test_fast.py"])

    def test_failure_summary_prefers_error_lines(self):
        out = "ok one\nERROR: the real cause\n" + "\n".join(f"warning pad {i}" for i in range(12))
        self.assertIn("the real cause", rrt.tail(out))

    def test_ci_glob_loop_counts_every_test_as_listed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "scripts").mkdir()
            (root / ".github" / "workflows").mkdir(parents=True)
            write(root / "scripts" / "test_a.py", "print('ok')\n")
            write(root / ".github" / "workflows" / "ci.yml", "run: |\n  for t in scripts/test_*.py; do python \"$t\"; done\n")
            f = rrt.stage_tools(root, 2, 20, False)
            self.assertNotIn("T-CI-MISSING", rules(f, "WARN"))
            self.assertEqual(f.count("FAIL"), 0, f.items)

    def test_main_exit_codes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "MCPEDL" / "Addons").mkdir(parents=True)
            self.assertEqual(rrt.main(["--root", str(root), "--only", "content"]), 0)
            self.assertEqual(rrt.main(["--root", str(root), "--only", "nope"]), 2)
            self.assertEqual(rrt.main(["--root", str(root), "--only", "logs"]), 2)
            write(root / "MCPEDL" / "Addons" / "A" / "behavior_pack" / "items" / "b.json", "{ nope")
            self.assertEqual(rrt.main(["--root", str(root), "--only", "content"]), 1)


if __name__ == "__main__":
    unittest.main()
