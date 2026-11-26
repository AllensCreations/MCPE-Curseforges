#!/usr/bin/env bash
# ============================================================
#  MCPE-Curseforges  ·  Snapshot Uploader  (gum edition)
#  Run:  ./upload
#  Source: /sdcard/Download/Snapshots/
# ============================================================

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCPEDL="$REPO_ROOT/MCPEDL"
SNAPSHOTS_DIR="/sdcard/Download/Snapshots"

# ── gum check ────────────────────────────────────────────────
if ! command -v gum &>/dev/null; then
  echo "❌  'gum' is not installed. Run: apt install gum"
  exit 1
fi

# ── theme ─────────────────────────────────────────────────────
export GUM_CHOOSE_CURSOR="▶ "
export GUM_CHOOSE_CURSOR_FOREGROUND="#00FFAA"
export GUM_CHOOSE_SELECTED_FOREGROUND="#00FFAA"
export GUM_CHOOSE_HEADER_FOREGROUND="#FFD700"
export GUM_CHOOSE_SELECTED_PREFIX="✔ "
export GUM_CHOOSE_UNSELECTED_PREFIX="  "

# ── header ────────────────────────────────────────────────────
print_header() {
  clear
  gum style \
    --foreground="#00FFAA" --border-foreground="#00FFAA" \
    --border=double --align=center --width=54 --padding="0 2" \
    "📸  MCPE Snapshot Uploader  ·  ALN Studios"
  echo ""
}

# ── category map ──────────────────────────────────────────────
declare -A CAT_ICON=(
  [Addons]="🧩  Addons"
  [Script]="📜  Script"
  [Maps]="🗺   Maps"
  [Minigame]="🎮  Minigame"
)
CATEGORIES=("Addons" "Script" "Maps" "Minigame")

# ── get packages in a category ────────────────────────────────
get_packages() {
  local cat="$1"
  find "$MCPEDL/$cat" -mindepth 1 -maxdepth 1 -type d \
    -exec test -d '{}/assets/snapshots' \; -print 2>/dev/null \
    | sort | xargs -I{} basename {}
}

# ── upload ────────────────────────────────────────────────────
do_upload() {
  local pkg_path="$1"; shift
  local files=("$@")
  local target="$MCPEDL/$pkg_path/assets/snapshots"
  local pkg_name; pkg_name="$(basename "$pkg_path")"

  print_header
  gum style --foreground="#FFD700" --bold "  📦 $pkg_name"
  gum style --foreground="#888"    "  📂 $target"
  echo ""
  gum style --foreground="#00FFAA" --bold "  Uploading ${#files[@]} file(s):"
  for f in "${files[@]}"; do
    gum style --foreground="#FFFFFF" "   + $(basename "$f")"
  done
  echo ""

  if ! gum confirm "  Upload to $pkg_name?"; then
    gum style --foreground="#888" --italic "  Cancelled."
    sleep 1; return
  fi

  echo ""
  local ok=0 fail=0
  for f in "${files[@]}"; do
    local fname; fname="$(basename "$f")"
    if cp "$f" "$target/$fname" 2>/dev/null; then
      gum style --foreground="#00FFAA" "  ✔  $fname"
      ((ok++))
    else
      gum style --foreground="#FF5555" "  ✘  $fname  (copy failed)"
      ((fail++))
    fi
  done

  echo ""
  gum style --foreground="#00FFAA" --bold "  Done! ✅   Uploaded: $ok   Failed: $fail"
  echo ""

  if gum confirm "  Stage with git add?"; then
    git -C "$REPO_ROOT" add "$target/"
    gum style --foreground="#00FFAA" "  ✔  Staged. Run git commit when ready."
  fi

  echo ""
  gum style --foreground="#888" "  Press Enter to continue..."
  read -rs
}

# ── main ──────────────────────────────────────────────────────
main() {
  while true; do
    print_header

    # ── Step 1: pick category ─────────────────────────────────
    local cat_labels=()
    for c in "${CATEGORIES[@]}"; do cat_labels+=("${CAT_ICON[$c]}"); done

    local chosen_label
    chosen_label=$(gum choose \
      --header="  Select a Category:" \
      --height=8 \
      "${cat_labels[@]}") || { echo ""; exit 0; }

    local chosen_cat=""
    for c in "${CATEGORIES[@]}"; do
      [[ "${CAT_ICON[$c]}" == "$chosen_label" ]] && { chosen_cat="$c"; break; }
    done

    # ── Step 2: pick package ──────────────────────────────────
    print_header
    gum style --foreground="#FFD700" --bold "  ${CAT_ICON[$chosen_cat]}"
    echo ""

    local pkg_list
    mapfile -t pkg_list < <(get_packages "$chosen_cat")

    if [[ ${#pkg_list[@]} -eq 0 ]]; then
      gum style --foreground="#FF5555" "  No packages found in $chosen_cat."
      sleep 2; continue
    fi

    local chosen_pkg
    chosen_pkg=$(gum choose \
      --header="  Select a Package:" \
      --height=18 \
      "${pkg_list[@]}") || continue

    local pkg_path="${chosen_cat}/${chosen_pkg}"

    # ── Step 3: scan Snapshots folder ────────────────────────
    print_header
    gum style --foreground="#FFD700" --bold "  📦 $chosen_pkg"
    echo ""

    if [[ ! -d "$SNAPSHOTS_DIR" ]]; then
      gum style --foreground="#FF5555" "  ❌  Folder not found:"
      gum style --foreground="#888"    "     $SNAPSHOTS_DIR"
      echo ""
      gum style --foreground="#FFD700" "  Create it and place your images inside, then retry."
      echo ""
      gum confirm "  Retry?" && continue || break
    fi

    # Collect image files
    local all_files=()
    while IFS= read -r -d '' f; do
      all_files+=("$(basename "$f")")
    done < <(find "$SNAPSHOTS_DIR" -maxdepth 1 -type f \
      \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \
         -o -iname "*.webp" -o -iname "*.gif" \) \
      -print0 | sort -z)

    if [[ ${#all_files[@]} -eq 0 ]]; then
      gum style --foreground="#FF5555" "  ❌  No images found in:"
      gum style --foreground="#888"    "     $SNAPSHOTS_DIR"
      echo ""
      gum style --foreground="#888" --italic "  Supported: .png  .jpg  .jpeg  .webp  .gif"
      echo ""
      gum confirm "  Retry?" && continue || break
    fi

    # ── Step 4: multi-select images ───────────────────────────
    gum style --foreground="#00FFAA" "  📂 $SNAPSHOTS_DIR"
    gum style --foreground="#888" --italic "  Space = toggle  ·  Enter = confirm"
    echo ""

    local chosen_names
    chosen_names=$(gum choose \
      --no-limit \
      --header="  Select images to upload:" \
      --height=20 \
      "${all_files[@]}") || continue

    if [[ -z "$chosen_names" ]]; then
      gum style --foreground="#888" --italic "  Nothing selected."
      sleep 1; continue
    fi

    # Build full paths
    local chosen_files=()
    while IFS= read -r name; do
      [[ -n "$name" ]] && chosen_files+=("$SNAPSHOTS_DIR/$name")
    done <<< "$chosen_names"

    # ── Step 5: upload ────────────────────────────────────────
    do_upload "$pkg_path" "${chosen_files[@]}"

    # ── Step 6: what next? ────────────────────────────────────
    print_header
    local next
    next=$(gum choose \
      --header="  What next?" \
      "📸  Upload more" \
      "🚪  Exit") || break

    [[ "$next" == "🚪  Exit" ]] && break
  done

  print_header
  gum style --foreground="#888" --italic "  Goodbye! 👋"
  echo ""
}

main "$@"
