import json
import os
import shutil
import sys
import tempfile
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
MODES = (("creative", "Creative"), ("survival", "Survival"))


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else HERE
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(HERE, "behavior_pack", "manifest.json"), encoding="utf-8") as f:
        version = json.load(f)["header"]["version"]
    full = ".".join(str(n) for n in version)
    short = ".".join(str(n) for n in version[:2])
    for mode, label in MODES:
        tmp = tempfile.mkdtemp()
        try:
            world = os.path.join(tmp, "world")
            shutil.copytree(os.path.join(HERE, "world"), world)
            pack = os.path.join(world, "behavior_packs", "OneBlockVoid")
            shutil.rmtree(pack)
            shutil.copytree(os.path.join(HERE, "behavior_pack"), pack)
            with open(os.path.join(pack, "scripts", "mode.js"), "w", encoding="utf-8") as f:
                f.write('export const WORLD_MODE = "%s";\n' % mode)
            with open(os.path.join(world, "levelname.txt"), "w", encoding="utf-8") as f:
                f.write("OneBlock Void Survival %s v%s [AllensCreations]\n" % (label, short))
            name = "OneBlock Void Survival %s by AllensCreations (V%s).mcworld" % (label, full)
            target = os.path.join(out, name)
            with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as z:
                for root, _, files in os.walk(world):
                    for fn in sorted(files):
                        full_path = os.path.join(root, fn)
                        z.write(full_path, os.path.relpath(full_path, world))
            print("Built " + target)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


main()
