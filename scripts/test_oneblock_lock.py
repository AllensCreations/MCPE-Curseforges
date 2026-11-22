#!/usr/bin/env python3
"""OneBlock world lock: level.dat byte flags are patched in place, only the intended bytes change."""
import importlib.util
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
REPO = SCRIPTS.parent
spec = importlib.util.spec_from_file_location("ob", SCRIPTS / "build_oneblock_variants_from_template.py")
ob = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ob)
FOUNDATION = REPO / "Mcpeworlds" / "Survival" / "level.dat"


@unittest.skipUnless(FOUNDATION.is_file(), "Mcpeworlds foundation not in this checkout")
class LockTests(unittest.TestCase):
    def setUp(self):
        self.raw = FOUNDATION.read_bytes()

    def test_flags_exist_in_every_foundation(self):
        for mode in ob.MODES:
            raw = (REPO / "Mcpeworlds" / mode / "level.dat").read_bytes()
            for flag in ob.LOCK_FLAGS + (ob.LOCK_FLAG_RESOURCE_PACK,) + ob.NEVER_SET_FLAGS:
                self.assertIn(ob.read_byte_tag(raw, flag), (0, 1), f"{mode} {flag}")

    def test_patch_changes_only_the_flag_bytes(self):
        out = self.raw
        for flag in ob.lock_flag_names(True):
            out = ob.patch_byte_tag(out, flag, 1)
        self.assertEqual(len(out), len(self.raw))
        changed = [i for i, (a, b) in enumerate(zip(self.raw, out)) if a != b]
        self.assertLessEqual(len(changed), 3)
        for flag in ob.lock_flag_names(True):
            self.assertEqual(ob.read_byte_tag(out, flag), 1)
        self.assertEqual(ob.read_byte_tag(out, "immutableWorld"), ob.read_byte_tag(self.raw, "immutableWorld"))

    def test_patch_level_dat_locks_and_unlocks_and_never_sets_immutable(self):
        with tempfile.TemporaryDirectory() as t:
            p = Path(t) / "level.dat"
            shutil.copyfile(FOUNDATION, p)
            ob.patch_level_dat(p, "Test - Survival", lock=True, has_resource_pack=True)
            raw = p.read_bytes()
            for flag in ob.lock_flag_names(True):
                self.assertEqual(ob.read_byte_tag(raw, flag), 1)
            self.assertEqual(ob.read_byte_tag(raw, "immutableWorld"), 0)
            ob.patch_level_dat(p, "Test - Creative", lock=False, has_resource_pack=True)
            raw = p.read_bytes()
            for flag in ob.lock_flag_names(True):
                self.assertEqual(ob.read_byte_tag(raw, flag), 0)

    def test_resource_pack_flag_only_with_a_resource_pack(self):
        self.assertNotIn(ob.LOCK_FLAG_RESOURCE_PACK, ob.lock_flag_names(False))
        self.assertIn(ob.LOCK_FLAG_RESOURCE_PACK, ob.lock_flag_names(True))

    def test_missing_tag_is_an_error(self):
        with self.assertRaises(ValueError):
            ob.patch_byte_tag(self.raw, "noSuchFlag", 1)


class ConfigTests(unittest.TestCase):
    def test_default_locks_survival_and_hardcore(self):
        self.assertEqual(ob.locked_modes({}), ("Survival", "Hardcore"))

    def test_override_and_empty_list(self):
        self.assertEqual(ob.locked_modes({"lock_settings": ["Survival"]}), ("Survival",))
        self.assertEqual(ob.locked_modes({"lock_settings": []}), ())

    def test_bad_value_is_rejected(self):
        for bad in ("Survival", ["Peaceful"], 3):
            with self.assertRaises(ValueError):
                ob.locked_modes({"lock_settings": bad})


if __name__ == "__main__":
    unittest.main()
