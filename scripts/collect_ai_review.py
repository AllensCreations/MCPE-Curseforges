#!/usr/bin/env python3
"""Build the AI review export of the given paths, or one of the three shared kits.

The same code serves the manual run and the automatic per-package run (scripts/auto_ai_review.py).
  PATHS=<comma/newline separated paths>   a pack export: index, AI instructions, every text file of the paths
  PATHS=NEW | UPDATE | REPO               a kit (REPO also accepts MAINTENANCE or TOOLS)
  AI_OUT=<output folder>                  default ai_review_bundle
  EXPORT_MODE=update_pack|new_pack|repo_maintenance
                                          update_pack (default): pack .txt only, no kit
                                          new_pack / repo_maintenance: also write that kit next to the pack .txt
  AI_SKIP_TOOLS=1                         never write a kit (overrides EXPORT_MODE)
  AI_MAX_BYTES=<n>                        pack export size budget (0 or unset = everything). Over budget, only the
                                          essential files (manifests, recipes, README, DESCRIPTION, project.json and the
                                          newest CHANGELOG entries) plus the smallest other files are inlined; the rest is
                                          listed with its size so the AI asks for exactly the paths it needs.

A kit is two files:
  <label>_tools.txt   directory map (directories only, with file counts) + the skills of that task. No file contents.
  <label>_files.zip   the complete, unchanged scripts the task has to RUN, as real files under files/.
                      They cost no context: the AI unzips and runs them.
Generated views (changelog_views/, Package/*.listing.md) are never exported: they are rebuilt from CHANGELOG.md
and DESCRIPTION.md and must not be hand-edited.
"""
import os, re, pathlib, zipfile

EXPORT_MODE = os.environ.get("EXPORT_MODE", "update_pack").strip().lower()

KIT_SKILLS = {
    "NEW": [".agents/skills/mcpe-context7/SKILL.md", ".agents/skills/mcpe-new-pack/SKILL.md"],
    "UPDATE": [".agents/skills/mcpe-context7/SKILL.md", ".agents/skills/mcpe-pack-update/SKILL.md"],
    "REPO": [".agents/skills/mcpe-context7/SKILL.md", ".agents/skills/mcpe-pack-update/SKILL.md"],
}
KIT_FILES = {
    "NEW": [
        "scripts/make_pack_script.py", "scripts/build_payload.py", "scripts/import_project_payload.py",
        "scripts/doc_template.py", "scripts/pixel_json_to_png.py",
        "docs/mcicons-index.md",
        "assets/aln-ui-redesign/README.txt", "assets/aln-ui-redesign/design.json",
        "assets/aln-ui-redesign/font/README.txt", "assets/aln-ui-redesign/font/pixelify.js",
    ],
    "UPDATE": ["scripts/make_update_script.py", "scripts/apply_update.py", "scripts/pixel_json_to_png.py", "docs/mcicons-index.md"],
    "REPO": ["scripts/make_update_script.py", "scripts/apply_update.py", "scripts/check_instruction_files.py", "docs/mcicons-index.md"],
}

TREE_SKIP = {".git", "node_modules", "__pycache__", "db", "exports"}
TREE_KEEP_HIDDEN = {".agents", ".github"}
CATEGORIES = ("Addons", "Maps", "Script", "Minigame")
OPAQUE = {"builds", "Package", "changelog_views", "graphify-out", "reference", "archive", "dashboard", "Mcpeworlds", "ai-review", "AI Review"}
DIR_NOTES = {
    ".agents/skills": "agent skills, one folder each",
    ".github/workflows": "CI and dispatch workflows",
    "docs": "the ONLY folder Context7 indexes: rules, script summaries, Bedrock guide (query it, do not dump it)",
    "scripts": "build, validate, package and update tooling (run it, do not retype it)",
    "MCPEDL": "all projects: Addons, Maps, Script, Minigame",
    "assets": "shared images and the ALN UI Redesign skin",
    "assets/aln-ui-redesign": "shared UI skin (read for any pack with a menu)",
    "builds": "GENERATED packages, never edit",
    "Package": "GENERATED listing kits, never edit",
    "changelog_views": "GENERATED changelog views, never edit",
    "ai-review": "GENERATED AI review exports, never edit",
    "AI Review": "GENERATED AI review exports (MCPEDL/AI Review), never edit",
    "reference": "vanilla Bedrock reference data",
    "Mcpeworlds": "map templates and shared map assets",
    "tests": "tests",
    "dashboard": "web dashboard",
    "archive": "old material",
    "graphify-out": "GENERATED repo graph",
}


def _visible(n):
    return not n.startswith(".") or n in TREE_KEEP_HIDDEN


def _subdirs(d):
    try:
        with os.scandir(d) as it:
            return sorted((e for e in it if e.is_dir(follow_symlinks=False) and e.name not in TREE_SKIP and _visible(e.name)),
                          key=lambda e: e.name.lower())
    except OSError:
        return []


def _count_files(d):
    return sum(len(fs) for _, _, fs in os.walk(d))


def directory_map(root):
    """Directories only, one line each, built from the working tree so it can never go stale."""
    lines = []

    def line(rel, count, extra=""):
        note = DIR_NOTES.get(rel)
        lines.append(f"- `{rel}/` ({count} file{'' if count == 1 else 's'}{extra})" + (f": {note}" if note else ""))

    def walk(d, rel, depth):
        for e in _subdirs(d):
            r = f"{rel}/{e.name}" if rel else e.name
            if rel == "MCPEDL" and e.name in CATEGORIES:
                projects = _subdirs(e.path)
                lines.append(f"- `MCPEDL/{e.name}/` ({len(projects)} project{'' if len(projects) == 1 else 's'})")
                continue
            line(r, _count_files(e.path))
            if r in OPAQUE or depth >= 2:
                continue
            walk(e.path, r, depth + 1)

    walk(str(root), "", 0)
    layout = {}
    for cat in [c for c in _subdirs(root / "MCPEDL") if c.name in CATEGORIES] if (root / "MCPEDL").is_dir() else []:
        for proj in _subdirs(cat.path):
            for sub in _subdirs(proj.path):
                layout[sub.name] = layout.get(sub.name, 0) + 1
    if layout:
        parts = ", ".join(f"`{k}/` ({v})" for k, v in sorted(layout.items(), key=lambda kv: (-kv[1], kv[0])))
        lines.append("")
        lines.append("Inside every `MCPEDL/<Category>/<Name>/` project (how many projects have it): " + parts + ".")
    return "\n".join(lines)


def _fence(data):
    runs = re.findall(r"`+", data)
    return "`" * max(3, max((len(r) for r in runs), default=0) + 1)


def build_kit(root, kit, out, label):
    """Write <label>_tools.txt (map + skills) and, when the kit has files, <label>_files.zip. Returns names written."""
    skills, missing = [], []
    for rel in KIT_SKILLS[kit]:
        p = root / rel
        if p.is_file():
            skills.append((rel, p.read_text(encoding="utf-8", errors="replace")))
        else:
            missing.append(rel)
    files = [(rel, root / rel) for rel in KIT_FILES[kit] if (root / rel).is_file()]
    missing += [rel for rel in KIT_FILES[kit] if not (root / rel).is_file()]
    zip_name = f"{label}_files.zip"
    parts = ["# Repo Map (directories only)\n",
             "No file contents are pasted here on purpose. Rules, docs and script source are read through Context7 `query-docs` "
             "(see the `mcpe-context7` skill below). Do not ask for a full dump.\n"]
    if files:
        parts.append(f"The complete, unchanged scripts this task has to RUN are in the same kit zip as this file, under `files/`: unzip and run them, never retype them.\n")
        parts += [f"- `files/{rel}`" for rel, _ in files] + [""]
    parts += ["Project version and release notes: see the pack's own `CHANGELOG.md`. The repo's files win over any cached Context7 index.\n"]
    parts += ["## Directories\n", directory_map(root), ""]
    for rel, text in skills:
        f = _fence(text)
        parts += [f"## Skill: {rel}\n", f"{f}markdown", text.rstrip("\n"), f, ""]
    if missing:
        parts += ["## Not found", ""] + [f"- `{m}`" for m in missing] + [""]
    out.mkdir(parents=True, exist_ok=True)
    written = [f"{label}_tools.txt"]
    (out / written[0]).write_text("\n".join(parts), encoding="utf-8")
    if files:
        with zipfile.ZipFile(out / zip_name, "w", zipfile.ZIP_DEFLATED) as z:
            for rel, p in files:
                info = zipfile.ZipInfo("files/" + rel, date_time=(2020, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o644 << 16
                z.writestr(info, p.read_bytes(), compresslevel=9)
        written.append(zip_name)
    return written


AI_PROMPT = r'''# AI Instructions & Review Notes

Repo: https://github.com/AllensCreations/MCPE-Curseforges.git (branch main)
Use Context7 to query this repository's documentation (`docs/`) for project scripts, coding instructions, and Bedrock conventions before reviewing the pack changes. Batch your lookup into a single Context7 query.
Delivery steps: the `mcpe-pack-update` skill (new project: `mcpe-new-pack`).

## Action Notes: __ACTION_NOTE_TYPE__
__ACTION_NOTES__

## Destination
Repo-root-relative folders for this work:
__DEST__
- .sh paths start at repo root, stay inside these folders. New files go here too.
- First folder -> `DEST=` variable at script top. Use it for every path and `git add`.

## Rules
1. NEVER invent features, versions, links, assets, test results.
2. Output only what changed. Smallest edits. No unrelated rewrites.
3. No notes or summaries unless asked.
4. NEVER edit generated files: `builds/`, `Package/`, `changelog_views/`, `MCPEDL/AI Review/`, `MCPEDL/README.md`.

## Reply Format (STRICT, same as INSTRUCTIONS.md "Reply Format")
```
[SYSTEM_CONFIG]
Mode: Direct Execution
Token_Efficiency: Maximum
Rules: no greeting, intro, outro, offers, restating. High technical accuracy.
```
Output ONLY these three sections in order:
1. **File Needed:** repo-root-relative path of each file created/edited.
2. **Changelog:** bullets, brief summary of changes.
3. **Termux Script:** ONE fenced `bash` block holding the ready-to-run commands, and ONE generated self-contained `<Pack>_v<Version>_<rand>.sh` update script (built with `make_update_script.py`). The script contains the full UI, automatically pulls, applies edits safely, commits, and pushes.
'''

raw_paths = [p.strip().strip("'\"") for p in re.split(r"[,\n]", os.environ["PATHS"]) if p.strip()]
_kw = [p.upper() for p in raw_paths]
new_pack      = _kw == ["NEW"]          # new-pack kit
update_kit    = _kw == ["UPDATE"]       # update-pack tools kit
repo_kit      = _kw in (["REPO"], ["MAINTENANCE"], ["TOOLS"])  # repo-maintenance kit
if new_pack or update_kit or repo_kit:
    raw_paths = []


def safe(x):
    return re.sub(r"[^A-Za-z0-9._-]+", "_", x).strip("_.")

def auto_label():
    names = []
    for e in raw_paths:
        last = [c for c in pathlib.PurePosixPath(e.rstrip("/")).parts if c not in (".", "")]
        n = safe(last[-1]) if last else ""
        if n and n not in names:
            names.append(n)
    if not names:
        return "export"
    label = "+".join(names[:3]) + ("+more" if len(names) > 3 else "")
    return label[:80]

label = ("New-Pack" if new_pack else
         "Update-Pack" if update_kit else
         "Repo-Maintenance" if repo_kit else
         (auto_label() or "export"))


root = pathlib.Path(".").resolve()
SKIP_DIRS = {".git", "db", "node_modules", "__pycache__", "exports", "ai-review", "AI Review"}
SKIP_FILENAMES = {"LOCK", ".gitkeep"}
selected, skipped, missing = {}, [], []
dests = []

def is_text(p: pathlib.Path) -> bool:
    try:
        head = p.read_bytes()[:8192]
    except OSError:
        return False
    if b"\x00" in head:
        return False
    try:
        head.decode("utf-8")
    except UnicodeDecodeError as e:
        # a multi-byte char cut at the 8 KB boundary is fine
        return e.start >= len(head) - 4
    return True

def add(p: pathlib.Path):
    try:
        rel = p.resolve().relative_to(root)
    except ValueError:
        return  # outside the repo
    if any(part in SKIP_DIRS for part in rel.parts):
        return
    if p.name in SKIP_FILENAMES:
        return
    if not p.is_file():
        return
    if is_text(p):
        selected[rel.as_posix()] = p
    else:
        skipped.append(rel.as_posix())

for entry in raw_paths:
    if ".." in pathlib.PurePosixPath(entry).parts or entry.startswith("/"):
        missing.append(entry + "  (not allowed: must be inside the repo)")
        continue
    matches = sorted(root.glob(entry))
    if not matches:
        missing.append(entry)
        continue
    for m in matches:
        try:
            d = (m if m.is_dir() else m.parent).relative_to(root).as_posix() or "."
            if d not in dests:
                dests.append(d)
        except ValueError:
            pass
        if m.is_dir():
            for f in sorted(m.rglob("*")):
                add(f)
        else:
            add(m)

# Always include the docs next to each destination so the AI can see the current CHANGELOG.md and version.
# The generated views (changelog_views/, Package/*.listing.md) are NOT exported: rebuilt by CI, never hand-edited.
for d in list(dests):
    base = root / d
    for doc in ("CHANGELOG.md", "README.md", "DESCRIPTION.md"):
        add(base / doc)

files = sorted(selected, key=str.lower)
if missing:
    for m in missing:
        print(f"::warning::Path not found or not allowed: {m}")
if not files and not (new_pack or update_kit or repo_kit):
    raise SystemExit("::error::Nothing matched. Check the paths (case-sensitive, relative to the repo root).")


# Detect the current version from every exported CHANGELOG.md (top release heading)
version_lines, top_versions = [], []
for rel in files:
    if pathlib.PurePosixPath(rel).name != "CHANGELOG.md":
        continue
    text = selected[rel].read_text(encoding="utf-8", errors="replace")
    mv = re.search(r"^## \[(?:v)?(\d+)(?:\.(\d+)\.(\d+)(?:\.(\d+))?)?\]", text, re.M)
    if mv:
        first, b, c, d = mv.groups()
        if b is not None and c is not None:
            if d is not None:  # legacy X.Y.Z.A -> X.Z.A
                first, b, c = first, c, d
            a, b, c = int(first), int(b), int(c)
            # Legacy X.Y.Z converts to v(X+1)
            v_curr = f"v{a}"
            v_next = f"v{a + 1}"
            version_lines.append(f"CURRENT VERSION: {v_curr} / NEXT UPDATE: {v_next}  ({rel})")
            top_versions.append(v_curr)
        else:
            v_num = int(first)
            version_lines.append(f"CURRENT VERSION: v{v_num} / NEXT UPDATE: v{v_num + 1}  ({rel})")
            top_versions.append(f"v{v_num}")

MAX_BYTES = int(os.environ.get("AI_MAX_BYTES", "0") or 0)
ESSENTIAL_NAMES = {"manifest.json", "README.md", "DESCRIPTION.md", "project.json", "CHANGELOG.md"}
CHANGELOG_LINES = 60


def essential(rel):
    return pathlib.PurePosixPath(rel).name in ESSENTIAL_NAMES or "/recipes/" in rel


inline, not_inlined = list(files), []
if MAX_BYTES and sum(selected[r].stat().st_size for r in files) > MAX_BYTES:
    used = sum(min(selected[r].stat().st_size, 8000) for r in files if essential(r))
    inline = [r for r in files if essential(r)]
    for r in sorted((r for r in files if not essential(r)), key=lambda r: (selected[r].stat().st_size, r.lower())):
        size = selected[r].stat().st_size
        if used + size <= MAX_BYTES:
            inline.append(r)
            used += size
        else:
            not_inlined.append((r, size))
    inline.sort(key=str.lower)

blocks = []
for rel in inline:
    data = selected[rel].read_bytes().decode("utf-8", errors="replace")
    if not_inlined and pathlib.PurePosixPath(rel).name == "CHANGELOG.md" and data.count("\n") > CHANGELOG_LINES:
        data = "\n".join(data.split("\n")[:CHANGELOG_LINES]) + "\n\n(older entries omitted; ask for the full file if needed)"
    runs = re.findall(r"`+", data)
    fence = "`" * max(3, max((len(r) for r in runs), default=0) + 1)
    head = f"## FILE: {rel} ({data.count(chr(10)) + 1} lines, {len(data.encode('utf-8'))} bytes)"
    blocks.append((rel, f"\n{head}\n\n{fence}\n{data.rstrip(chr(10))}\n{fence}\n"))

out = pathlib.Path(os.environ.get("AI_OUT", "ai_review_bundle")); out.mkdir(parents=True, exist_ok=True)
is_kit = new_pack or update_kit or repo_kit
kit = ("NEW" if new_pack else "UPDATE" if update_kit else "REPO" if repo_kit else
       "NEW" if EXPORT_MODE == "new_pack" else "REPO" if EXPORT_MODE == "repo_maintenance" else None)
if os.environ.get("AI_SKIP_TOOLS") == "1":
    kit = None
kit_written = build_kit(root, kit, out, label) if kit else []
if is_kit:
    with open(os.environ.get("GITHUB_OUTPUT") or os.devnull, "a", encoding="utf-8") as fh:
        fh.write(f"label={label}\nartifact_name={label}\n")
    print(f"Kit {kit}: wrote {', '.join(kit_written) if kit_written else 'nothing (AI_SKIP_TOOLS=1)'} into {out}")
    raise SystemExit(0)
name = f"{label}.txt"
index = ["- **Export request:** " + ", ".join(f"`{r}`" for r in raw_paths),
         "- **Destination:** " + ", ".join(f"`{d}`" for d in dests)]
index += [f"- **{v.split('  (')[0]}**  (`{v.split('  (')[1].rstrip(')')}`)" for v in version_lines]
index.append("- **Current version:** Project version and release notes: see the pack's own `CHANGELOG.md`.")
index += [f"- **Text files:** {len(files)}", f"- **Skipped binary:** {len(skipped)}", f"- **Paths not found:** {len(missing)}", "", "### Files in this export", ""]
index += [f"- `{r}`" for r in inline]
if not_inlined:
    index += ["", f"### Not inlined: {len(not_inlined)} larger file(s), ask the user for the exact paths you need", ""]
    index += [f"- `{r}` ({s} bytes)" for r, s in sorted(not_inlined, key=lambda x: x[0].lower())]
if missing:
    index += ["", "### Not found", ""] + [f"- `{m}`" for m in missing]
if skipped:
    index += ["", f"### Skipped (binary): {len(skipped)} file(s)", ""] + [f"- `{x}`" for x in skipped[:40]]
    if len(skipped) > 40:
        index.append(f"- ... and {len(skipped) - 40} more")
if new_pack:
    action_type = "Package Creation Notes"
    action_notes = (
        "- **Mode**: NEW pack creation.\n"
        "- Follow PACK_GENERATOR_INSTRUCTIONS.md (query via Context7).\n"
        "- Deliver ONE pack `.sh` generated from `scripts/make_pack_script.py` with base64 payload."
    )
elif repo_kit:
    action_type = "Repo Improvement / Maintenance Notes"
    action_notes = (
        "- **Mode**: Repository maintenance & tooling improvement.\n"
        "- Follow standard Python script practices in `scripts/`.\n"
        "- Validate changes using `python3 scripts/check_instruction_files.py` and unit tests."
    )
else:
    action_type = "Package Update Notes"
    v_info = ", ".join(v.split('  (')[0] for v in version_lines) if version_lines else "Target Update: vNext"
    action_notes = (
        f"- **Mode**: UPDATE existing package ({v_info}).\n"
        "- Retain all UUIDs in manifests.\n"
        "- Update CHANGELOG.md with a new release entry at top under `---`.\n"
        "- Deliver changes as ONE `spec_v<N>.txt` (INSTRUCTIONS.md Reply Format); the user builds the `.sh` with `scripts/make_update_script.py`.\n"
        "- Need command formats or templates? Query Context7 for `make_update_script.py` and `DOCS_RULES.md`."
    )

instructions = (
    AI_PROMPT
    .replace("__ACTION_NOTE_TYPE__", action_type)
    .replace("__ACTION_NOTES__", action_notes)
    .replace("__DEST__", "\n".join("- " + d for d in dests) or "- .")
)

skill_blocks = []
if not new_pack and not repo_kit:
    # Always embed the core skills into the pack AI review so any agent has them immediately
    for s_rel in [".agents/skills/mcpe-context7/SKILL.md", ".agents/skills/mcpe-pack-update/SKILL.md"]:
        s_path = root / s_rel
        if s_path.is_file():
            s_text = s_path.read_text(encoding="utf-8", errors="replace").rstrip("\n")
            f = _fence(s_text)
            skill_blocks.append(f"\n## Skill: {s_rel}\n\n{f}markdown\n{s_text}\n{f}\n")

skills_section = "\n---\n\n## Skills\n" + "".join(skill_blocks) if skill_blocks else ""

content = ("# Repo Export\n\n## Index\n\n" + "\n".join(index) + "\n\n---\n\n"
           + instructions.strip()
           + skills_section + "\n\n---\n\n"
           + "## File Contents\n" + "".join(b for _, b in blocks))
(out / name).write_text(content, encoding="utf-8")

with open(os.environ.get("GITHUB_OUTPUT") or os.devnull, "a", encoding="utf-8") as fh:
    fh.write(f"label={label}\n")
    fh.write(f"artifact_name={'(' + top_versions[0] + ') ' + label if top_versions else label}\n")
print(f"Exported {len(files)} files into {out}/{name}"
      + (f" and kit {kit}: {', '.join(kit_written)}" if kit_written else "")
      + f"; skipped {len(skipped)} binary; {len(missing)} path(s) not found.")
