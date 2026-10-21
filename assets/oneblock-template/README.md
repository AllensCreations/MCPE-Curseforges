# OneBlock World Template

This directory is populated automatically from the supplied `Void_For_Workv2.mcworld` source archive.

- Keep the complete extracted world here, including `level.dat`, `level.dat_old` when supplied, `levelname.txt`, `db/`, world pack manifests, and any other original world files.
- Do not edit the master world while building an output map.
- The builder copies this directory into a temporary staging area, updates the staged world name, and packages all files into a new `.mcworld`.
- If this directory is empty or missing, place the original archive at `assets/oneblock-template.mcworld` and run `python3 scripts/create_mcpe_world.py --name "Your World Name"` once to extract it.

The source world archive is intentionally not replaced with a metadata-only approximation: its LevelDB files are essential world data.
