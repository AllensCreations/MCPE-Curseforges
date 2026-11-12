import unittest
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
import rename_packages as rp


class RenamePackages(unittest.TestCase):
    def test_old_names_become_short_names(self):
        self.assertEqual(rp.new_name("Mining Helmet by ALNStudios (V1.0.2).mcaddon", "MiningHelmet"), "MiningHelmet V1.0.2.mcaddon")
        self.assertEqual(rp.new_name("Release - Mining Helmet v(2.0.0).mcaddon", "MiningHelmet"), "MiningHelmet V2.0.0.mcaddon")
        self.assertEqual(rp.new_name("Oneblock SM by ALNStudios (V1.0.0) - Creative.mcworld", "OneblockSM"), "OneblockSM V1.0.0 Creative.mcworld")

    def test_new_names_are_left_alone(self):
        self.assertIsNone(rp.new_name("MiningHelmet V1.0.2.mcaddon", "MiningHelmet"))
        self.assertIsNone(rp.new_name("Some Map - Test.mcworld", "X"))

    def test_reference_forms_cover_encoded_links(self):
        forms = rp.forms("A by ALNStudios (V1.0.0).mcaddon")
        self.assertIn("A%20by%20ALNStudios%20%28V1.0.0%29.mcaddon", forms)
        self.assertIn("A%20by%20ALNStudios%20(V1.0.0).mcaddon", forms)


if __name__ == "__main__":
    unittest.main()
