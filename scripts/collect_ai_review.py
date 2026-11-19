#!/usr/bin/env python3
"""Build the AI review export of the given paths (index, AI instructions, every text file).

Moved out of .github/workflows/collect-ai-review-files.yml so the same code serves the manual run and the
automatic per-package run (scripts/auto_ai_review.py).
  PATHS=<comma/newline separated paths>   (NEW = new-pack kit)
  AI_OUT=<output folder>                  default ai_review_bundle
  EXPORT_MODE=update_pack|new_pack|repo_maintenance
                                          update_pack (default): pack .txt only, NO tools.txt (fastest; ~60 KB)
                                          new_pack: lean kit — SKILL.md + instruction markdowns only, NO Python scripts
                                          repo_maintenance: full bundle with all scripts
  AI_SKIP_TOOLS=1                         legacy override: do not write <label>_tools.txt (overrides EXPORT_MODE)
"""
import os, re, pathlib

EXPORT_MODE = os.environ.get("EXPORT_MODE", "update_pack").strip().lower()
# Tool files for new_pack: UI assets and generator/validator scripts per SKILL.md.
# High-volume documentation (INSTRUCTIONS.md, PACK_GENERATOR_INSTRUCTIONS.md, DOCS_RULES.md)
# is indexed in Context7 and queried dynamically to optimize tokens.
LEAN_TOOL_FILES = [
    ".agents/skills/mcpe-new-pack/SKILL.md",
    "scripts/make_pack_script.py",
    "scripts/build_payload.py",
    "scripts/import_project_payload.py",
    "scripts/doc_template.py",
    "scripts/pixel_json_to_png.py",
    "scripts/crafting_template.py",
    "scripts/CRAFTING_TABLE.svg",
    "assets/aln-ui-redesign/README.txt",
    "assets/aln-ui-redesign/design.json",
    "assets/aln-ui-redesign/font/README.txt",
    "assets/aln-ui-redesign/font/pixelify.js",
]

AI_PROMPT = r'''# AI Instructions & Review Notes

Repo: https://github.com/AllensCreations/MCPE-Curseforges.git (branch main)
Context7 Support: Enabled. For full instructions, schemas, and helper script syntax, query Context7 (`INSTRUCTIONS.md`, `PACK_GENERATOR_INSTRUCTIONS.md`, `DOCS_RULES.md`, `make_update_script.py`, `doc_template.py`).

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
3. No notes/summaries/explanations unless asked.
4. Any project type (add-on, map, script, workflow, website). Keep folder layout.

## Update request = ONE Termux script
- Name: `<Repofilename>_<Version>_<RAND>.sh` (e.g. `Monster-Companions_v2_k7q2x.sh`). Deliver as downloadable file.
- Repofilename: project/folder/file changed. No extension, no spaces (hyphens ok).
- Version: new vX format. Update = X+1 (e.g., v1 -> v2, or legacy 1.3.4 -> v2).
- RAND: >=5 random lowercase letters/digits. Fresh every script. NEVER reuse.
Script order:
1. `#!/data/data/com.termux/files/usr/bin/bash` + `set -e`
2. `cd "$HOME/MCPE-Curseforges"`; `git clone` repo URL first if folder missing
3. `git pull --rebase`
4. Apply ALL changes as exact search-and-replace edits via `python3 scripts/make_update_script.py spec.txt` (format queryable via Context7).
5. Validate every changed .json with python3. Stop on error.
5b. Verify top CHANGELOG.md heading == new vX == script filename version. If project has manifests: run `python3 scripts/manifest_tools.py --project "$DEST" --set X.0.0` (or `vX`).
6. `git add` changed paths only; `git commit -m "<short message>"`; `git push`
6b. Add an entry to the ROOT `CHANGELOG.md`: `## [vN] - YYYY-MM-DD - [Update Name]`
7. Idempotent: skip anything already applied.
8. Last line: `rm -f -- "$SELF"` (self-deleting script).

## Documentation Standards
- Query Context7 for exact `DOCS_RULES.md` formatting templates.
- CHANGELOG.md: MANDATORY on every update (`## [vX] - YYYY-MM-DD - [Update Name]`).
- Player-facing only: in-game item names ("Diamond"), NEVER code identifiers (`minecraft:diamond`), internal function names, or raw JSON keys.
- README.md: download landing page only (11 non-empty lines).
- DESCRIPTION.md: full details, standard badges, feature cards, guidelines block.

## Reply Format (STRICT)
```
[SYSTEM_CONFIG]
Mode: Direct Execution
Token_Efficiency: Maximum
Rules: no greeting, intro, outro, offers, restating. High technical accuracy.
```
Output ONLY these three sections in order:
1. **File Needed:** repo-root-relative path of each file created/edited.
2. **Changelog:** bullets, brief summary of changes.
3. **Termux Script:** ONE fenced `bash` block holding ONLY the run commands: `bash ~/storage/downloads/<Repofilename>_<Version>_<RAND>.sh`.
'''

raw_paths = [p.strip().strip("'\"") for p in re.split(r"[,\n]", os.environ["PATHS"]) if p.strip()]
_kw = [p.upper() for p in raw_paths]
new_pack      = _kw == ["NEW"]          # new-pack kit: tools txt only
update_kit    = _kw == ["UPDATE"]       # update-pack tools kit
repo_kit      = _kw in (["REPO"], ["MAINTENANCE"], ["TOOLS"])  # repo-maintenance tools kit
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
SKIP_DIRS = {".git", "db", "node_modules", "__pycache__", "exports", "ai-review"}
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

# Always include the docs next to (or one level above) each destination,
# so the AI can see the current CHANGELOG.md and version. add() ignores missing files.
for d in list(dests):
    base = root / d
    for doc in ("CHANGELOG.md", "README.md", "DESCRIPTION.md"):
        add(base / doc)
    view_name = pathlib.PurePosixPath(d).name
    for ext in (".github.md", ".curseforge.html"):
        add(root / "changelog_views" / (view_name + ext))
    add(root / "Package" / (view_name + ".listing.md"))

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

blocks = []
for rel in files:
    data = selected[rel].read_bytes().decode("utf-8", errors="replace")
    runs = re.findall(r"`+", data)
    fence = "`" * max(3, max((len(r) for r in runs), default=0) + 1)
    head = f"## FILE: {rel} ({data.count(chr(10)) + 1} lines, {len(data.encode('utf-8'))} bytes)"
    blocks.append((rel, f"\n{head}\n\n{fence}\n{data.rstrip(chr(10))}\n{fence}\n"))

out = pathlib.Path(os.environ.get("AI_OUT", "ai_review_bundle")); out.mkdir(parents=True, exist_ok=True)
name = f"{label}.txt"
index = ["- **Export request:** " + ", ".join(f"`{r}`" for r in raw_paths),
         "- **Destination:** " + ", ".join(f"`{d}`" for d in dests)]
index += [f"- **{v.split('  (')[0]}**  (`{v.split('  (')[1].rstrip(')')}`)" for v in version_lines]
index += [f"- **Text files:** {len(files)}", f"- **Skipped binary:** {len(skipped)}", f"- **Paths not found:** {len(missing)}", "", "### Files in this export", ""]
index += [f"- `{r}`" for r in files]
if missing:
    index += ["", "### Not found", ""] + [f"- `{m}`" for m in missing]
if skipped:
    index += ["", "### Skipped (binary)", ""] + [f"- `{x}`" for x in skipped[:1000]]
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
        "- Deliver changes as ONE Termux update script (`scripts/make_update_script.py`).\n"
        "- Need command formats or templates? Query Context7 for `make_update_script.py` and `DOCS_RULES.md`."
    )

instructions = (
    AI_PROMPT
    .replace("__ACTION_NOTE_TYPE__", action_type)
    .replace("__ACTION_NOTES__", action_notes)
    .replace("__DEST__", "\n".join("- " + d for d in dests) or "- .")
)
content = ("# Repo Export\n\n## Index\n\n" + "\n".join(index) + "\n\n---\n\n"
           + instructions.strip() + "\n\n---\n\n"
           + "## File Contents\n" + "".join(b for _, b in blocks))
(out / name).write_text(content, encoding="utf-8")

# OTHER: instruction files + helper scripts in ONE txt (text only; binaries are named in the index)
# Skip tools.txt entirely for update_pack mode (or when AI_SKIP_TOOLS=1) — pack .txt has everything needed
skip_tools = os.environ.get("AI_SKIP_TOOLS") == "1" or (EXPORT_MODE == "update_pack" and not update_kit and not repo_kit and not new_pack)
# new_pack / UPDATE keyword: lean kit (instructions + UI assets only, no Python scripts)
# repo_maintenance / REPO keyword: full bundle with all scripts
if EXPORT_MODE == "new_pack" or new_pack or update_kit:
    tool_files = LEAN_TOOL_FILES
else:
    tool_files = [".agents/skills/mcpe-new-pack/SKILL.md"] + [
        "scripts/" + t for t in (
            "build_payload.py", "import_project_payload.py", "crafting_template.py",
            "generate_recipe_images.py", "convert_crafting_recipe_svgs_to_png.py",
            "ensure_recipe_unlocks.py", "make_pack_icon.py", "optimize_images.py",
            "manifest_tools.py", "doc_template.py", "pixel_json_to_png.py", "make_pack_script.py", "make_update_script.py", "apply_update.py", "CRAFTING_TABLE.svg")] + [
        "assets/aln-ui-redesign/README.txt", "assets/aln-ui-redesign/design.json",
        "assets/aln-ui-redesign/font/README.txt", "assets/aln-ui-redesign/font/pixelify.js"]
t_ok, t_missing, t_blocks = [], [], []
for rel in tool_files:
    p = root / rel
    if not p.is_file() or not is_text(p):
        t_missing.append(rel)
        continue
    data = p.read_bytes().decode("utf-8", errors="replace")
    runs = re.findall(r"`+", data)
    fence = "`" * max(3, max((len(r) for r in runs), default=0) + 1)
    t_ok.append(rel)
    t_blocks.append(f"\n## FILE: {rel} ({data.count(chr(10)) + 1} lines, {len(data.encode('utf-8'))} bytes)\n\n{fence}\n{data.rstrip(chr(10))}\n{fence}\n")
t_index = [f"- `{r}`" for r in t_ok]
if t_missing:
    t_index += ["", "### Not found / not text", ""] + [f"- `{m}`" for m in t_missing]
t_index += ["", "### Binary helpers (stay in the repo, not exported)", "",
            "- `scripts/CRAFTING_TABLE.png`", "- `assets/Images/`", "- `assets/aln-ui-redesign/`", "- `Mcpeworlds/assets/`"]
if not skip_tools: (out / f"{label}_tools.txt").write_text(
    "# Pack Tools and Instructions\n\n## Index\n\n" + "\n".join(t_index)
    + "\n\n---\n\n## File Contents\n" + "".join(t_blocks), encoding="utf-8")
with open(os.environ.get("GITHUB_OUTPUT") or os.devnull, "a", encoding="utf-8") as fh:
    fh.write(f"label={label}\n")
    fh.write(f"artifact_name={'(' + top_versions[0] + ') ' + label if top_versions else label}\n")
print(f"Exported {len(files)} files into {out}/{name}" + (f" and {len(t_ok)} tool files into {label}_tools.txt" if not skip_tools else f" (tools.txt skipped: mode={EXPORT_MODE})") + f"; skipped {len(skipped)} binary; {len(missing)} path(s) not found.")
