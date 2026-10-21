# OneBlock World Template

This directory is populated automatically from the supplied `Void_For_Workv2.mcworld` source archive.

- Keep the complete extracted world here, including `level.dat`, `level.dat_old` when supplied, `levelname.txt`, `db/`, world pack manifests, and any other original world files.
- Do not edit the master world while building an output map.
- The builder copies this directory into a temporary staging area, updates the staged world name, and packages all files into a new `.mcworld`.
- The current source archive is stored at `Assets/Oneblock-assets.mcworld`. The builder extracts it automatically when this directory has no complete template. The world-generation workflow commits the extracted files after the first successful build.

The source world archive is intentionally not replaced with a metadata-only approximation: its LevelDB files are essential world data.
