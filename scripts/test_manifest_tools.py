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
        "header": {"name": f"X (v{mt.fmt(bv)})", "description": "by ALNStudios", "uuid": BP, "version": bv},
        "modules": [{"type": "data", "uuid": "m1", "version": bv}],
        "dependencies": [{"uuid": RP, "version": rv}, {"module_name": "@minecraft/server", "version": "1.15.0"}]})
    write(f"{root}/resource_pack/manifest.json", {
        "format_version": 2,
        "header": {"name": f"X (v{mt.fmt(rv)})", "description": "by ALNStudios", "uuid": RP, "version": rv},
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
        self.assertEqual(bp["metadata"]["authors"], ["ALNStudios"])
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

    def test_package_name_follows_manifest_title_and_version(self):
        mt.align_project_manifests(self.root)
        self.assertEqual(mt.manifest_title(self.root), "X")
        self.assertEqual(mt.package_basename(self.root, "1.0.2", "Fallback"), "X by ALNStudios (V1.0.2)")

    def test_package_name_template_from_manifest_metadata(self):
        path = f"{self.root}/behavior_pack/manifest.json"
        data = json.load(open(path, encoding="utf-8"))
        data["metadata"] = {"package_filename": "{title} - {author} (V{version})"}
        write(path, data)
        self.assertEqual(mt.package_basename(self.root, "1.0.2", "F"), "X - ALNStudios (V1.0.2)")

    def test_template_without_version_token_falls_back(self):
        path = f"{self.root}/behavior_pack/manifest.json"
        data = json.load(open(path, encoding="utf-8"))
        data["metadata"] = {"package_filename": "{title}"}
        write(path, data)
        self.assertEqual(mt.package_basename(self.root, "1.0.2", "F"), "X by ALNStudios (V1.0.2)")

    def test_bp_rp_suffix_words_are_dropped_and_disagreement_uses_fallback(self):
        write(f"{self.root}/behavior_pack/manifest.json", {"header": {"name": "Foo BP (v1.0.2)", "uuid": BP, "version": [1, 0, 2]}})
        write(f"{self.root}/resource_pack/manifest.json", {"header": {"name": "Foo RP (v1.0.2)", "uuid": RP, "version": [1, 0, 2]}})
        self.assertEqual(mt.manifest_title(self.root), "Foo")
        write(f"{self.root}/resource_pack/manifest.json", {"header": {"name": "Bar (v1.0.2)", "uuid": RP, "version": [1, 0, 2]}})
        self.assertIsNone(mt.manifest_title(self.root))
        self.assertEqual(mt.package_basename(self.root, "1.0.2", "Desc Title"), "Desc Title by ALNStudios (V1.0.2)")

    def test_legacy_creator_name_is_migrated_on_align(self):
        path = f"{self.root}/behavior_pack/manifest.json"
        data = json.load(open(path, encoding="utf-8"))
        data["header"]["description"] = "Pack by ALNStudios"
        data["metadata"] = {"authors": ["ALNStudios"]}
        write(path, data)
        mt.align_project_manifests(self.root)
        bp = self.load("behavior_pack/manifest.json")
        self.assertEqual(bp["header"]["description"], "Pack by ALNStudios")
        self.assertEqual(bp["metadata"]["authors"], ["ALNStudios"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
