#!/usr/bin/env python3
"""Tests for manifest_tools: alignment, bumping, metadata and the source hash."""
import json, os, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifest_tools as mt

BP, RP = "11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"


def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(data if isinstance(data, str) else json.dumps(data, indent=2))


def make_project(root, bp_version=(1, 0, 0), rp_version=(1, 0, 2)):
    bv, rv = list(bp_version), list(rp_version)
    write(f"{root}/behavior_pack/manifest.json", {
        "format_version": 2,
        "header": {"name": f"X (v{mt.fmt(bv)})", "description": "by AllensCreations", "uuid": BP, "version": bv},
        "modules": [{"type": "data", "uuid": "m1", "version": bv}],
        "dependencies": [{"uuid": RP, "version": rv}, {"module_name": "@minecraft/server", "version": "1.15.0"}]})
    write(f"{root}/resource_pack/manifest.json", {
        "format_version": 2,
        "header": {"name": f"X (v{mt.fmt(rv)})", "description": "by AllensCreations", "uuid": RP, "version": rv},
        "modules": [{"type": "resources", "uuid": "m2", "version": rv}]})
    write(f"{root}/behavior_pack/scripts/main.js", "a\n")


class ManifestToolsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = self.tmp.name
        make_project(self.root)

    def tearDown(self):
        self.tmp.cleanup()

    def load(self, rel):
        with open(f"{self.root}/{rel}", encoding="utf-8") as fh:
            return json.load(fh)

    def test_align_uses_highest_and_keeps_uuids(self):
        target, changed = mt.align_project_manifests(self.root)
        self.assertEqual(target, [1, 0, 2])
        bp = self.load("behavior_pack/manifest.json")
        self.assertEqual(bp["header"]["version"], [1, 0, 2])
        self.assertEqual(bp["header"]["name"], "X (v1.0.2)")
        self.assertEqual(bp["header"]["uuid"], BP)
        self.assertEqual(bp["dependencies"][0]["version"], [1, 0, 2])
        self.assertEqual(bp["dependencies"][1]["version"], "1.15.0")
        self.assertEqual(bp["metadata"]["authors"], ["AllensCreations"])
        self.assertTrue(changed)

    def test_align_is_idempotent(self):
        mt.align_project_manifests(self.root)
        self.assertEqual(mt.align_project_manifests(self.root)[1], [])

    def test_title_without_suffix_is_not_rewritten(self):
        path = f"{self.root}/behavior_pack/manifest.json"
        data = self.load("behavior_pack/manifest.json")
        data["header"]["name"] = "Plain Title"
        write(path, data)
        mt.align_project_manifests(self.root)
        self.assertEqual(self.load("behavior_pack/manifest.json")["header"]["name"], "Plain Title")

    def test_bump_patch(self):
        self.assertEqual(mt.bump_patch([1, 0, 2]), [1, 0, 3])
        mt.align_project_manifests(self.root, target=mt.bump_patch(mt.highest_version(self.root)))
        self.assertEqual(mt.highest_version(self.root), [1, 0, 3])

    def test_hash_ignores_version_changes_but_not_source(self):
        mt.align_project_manifests(self.root)
        before = mt.compute_source_hash(self.root)
        mt.align_project_manifests(self.root, target=[1, 0, 3])
        self.assertEqual(before, mt.compute_source_hash(self.root))
        write(f"{self.root}/behavior_pack/scripts/main.js", "b\n")
        self.assertNotEqual(before, mt.compute_source_hash(self.root))

    def test_hash_ignores_docs_archives_and_derived_world_copy(self):
        mt.align_project_manifests(self.root)
        before = mt.compute_source_hash(self.root)
        write(f"{self.root}/README.md", "docs")
        write(f"{self.root}/Pack.mcaddon", "binary")
        write(f"{self.root}/world/behavior_packs/OneBlockVoid/x.json", "{}")
        self.assertEqual(before, mt.compute_source_hash(self.root))

    def test_installed_world_copies_are_not_source_manifests(self):
        write(f"{self.root}/world/behavior_packs/Old/manifest.json", {"header": {"version": [9, 9, 9]}})
        self.assertEqual(mt.highest_version(self.root), [1, 0, 2])


if __name__ == "__main__":
    unittest.main(verbosity=2)
