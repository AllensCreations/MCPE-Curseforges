#!/usr/bin/env bash
# ============================================================
#  MCPE-Curseforges  ·  Snapshot Uploader TUI
#  Source : ~/storage/downloads/Snapshots/
#  Target : MCPEDL/<Category>/<Package>/assets/snapshots/
# ============================================================

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCPEDL="$REPO_ROOT/MCPEDL"
SOURCE_DIR="$HOME/storage/downloads/Snapshots"

# ── colours ──────────────────────────────────────────────────
C_RESET='\033[0m'
C_BOLD='\033[1m'
C_DIM='\033[2m'
C_CYAN='\033[1;36m'
C_YELLOW='\033[1;33m'
C_GREEN='\033[1;32m'
C_RED='\033[1;31m'
C_BLUE='\033[1;34m'
C_MAGENTA='\033[1;35m'
C_WHITE='\033[1;37m'

# ── helpers ───────────────────────────────────────────────────
clear_screen() { printf '\033[2J\033[H'; }

print_header() {
  clear_screen
  echo -e "${C_CYAN}${C_BOLD}"
  echo "  ╔══════════════════════════════════════════════════════╗"
  echo "  ║      📸  MCPE Snapshot Uploader  ·  ALN Studios      ║"
  echo "  ╚══════════════════════════════════════════════════════╝"
  echo -e "${C_RESET}"
}

print_divider() {
  echo -e "${C_DIM}  ──────────────────────────────────────────────────────${C_RESET}"
}

# Pick an item from a list with arrow-key navigation
# Usage: menu_pick <title> <selected_var> item1 item2 ...
menu_pick() {
  local title="$1"
  local -n _result_ref="$2"
  shift 2
  local items=("$@")
  local count=${#items[@]}
  local sel=0

  # hide cursor
  tput civis 2>/dev/null

  while true; do
    print_header
    echo -e "  ${C_YELLOW}${C_BOLD}${title}${C_RESET}"
    print_divider
    echo -e "  ${C_DIM}Use ↑/↓ arrows and Enter to select  |  q to quit${C_RESET}"
    echo ""

    for i in "${!items[@]}"; do
      if [[ $i -eq $sel ]]; then
        echo -e "  ${C_GREEN}${C_BOLD} ▶  ${items[$i]}${C_RESET}"
      else
        echo -e "  ${C_DIM}    ${items[$i]}${C_RESET}"
      fi
    done

    # read one keypress
    IFS= read -rsn1 key
    if [[ "$key" == $'\x1b' ]]; then
      read -rsn2 -t 0.1 key2
      case "$key2" in
        '[A') ((sel = (sel - 1 + count) % count)) ;;  # up
        '[B') ((sel = (sel + 1) % count))          ;;  # down
      esac
    elif [[ "$key" == '' ]]; then
      break   # Enter
    elif [[ "$key" == 'q' || "$key" == 'Q' ]]; then
      tput cnorm 2>/dev/null
      print_header
      echo -e "  ${C_DIM}Goodbye! 👋${C_RESET}\n"
      exit 0
    fi
  done

  tput cnorm 2>/dev/null
  _result_ref="${items[$sel]}"
}

# ── step 1 · collect all packages ────────────────────────────
collect_packages() {
  local -n _pkgs="$1"
  _pkgs=()
  while IFS= read -r -d '' dir; do
    # Only dirs that have assets/snapshots/
    if [[ -d "$dir/assets/snapshots" ]]; then
      # Store as "Category/PackageName"
      local rel="${dir#$MCPEDL/}"
      _pkgs+=("$rel")
    fi
  done < <(find "$MCPEDL" -mindepth 2 -maxdepth 2 -type d -print0 | sort -z)
}

# ── step 2 · collect source images ───────────────────────────
collect_images() {
  local -n _imgs="$1"
  _imgs=()
  if [[ ! -d "$SOURCE_DIR" ]]; then
    return 1
  fi
  while IFS= read -r -d '' f; do
    _imgs+=("$f")
  done < <(find "$SOURCE_DIR" -maxdepth 1 -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" -o -iname "*.gif" \) -print0 | sort -z)
}

# ── step 3 · confirm & copy ───────────────────────────────────
do_upload() {
  local pkg="$1"
  local target="$MCPEDL/$pkg/assets/snapshots"
  local -n _imgs_ref="$2"

  print_header
  echo -e "  ${C_YELLOW}${C_BOLD}📦 Package :${C_RESET}  ${C_WHITE}$pkg${C_RESET}"
  echo -e "  ${C_YELLOW}${C_BOLD}📂 Target  :${C_RESET}  ${C_DIM}$target${C_RESET}"
  print_divider
  echo -e "  ${C_CYAN}${C_BOLD}Images to upload (${#_imgs_ref[@]}):${C_RESET}"
  echo ""

  for f in "${_imgs_ref[@]}"; do
    echo -e "  ${C_GREEN} +${C_RESET}  $(basename "$f")"
  done

  echo ""
  print_divider
  echo -e "  ${C_BOLD}Press ${C_GREEN}Y${C_RESET}${C_BOLD} to confirm upload  |  any other key to cancel${C_RESET}"
  IFS= read -rsn1 confirm

  if [[ "$confirm" != 'y' && "$confirm" != 'Y' ]]; then
    echo -e "\n  ${C_DIM}Cancelled.${C_RESET}\n"
    sleep 1
    return
  fi

  echo ""
  local ok=0 fail=0
  for f in "${_imgs_ref[@]}"; do
    local fname
    fname="$(basename "$f")"
    if cp "$f" "$target/$fname"; then
      echo -e "  ${C_GREEN}✔${C_RESET}  $fname"
      ((ok++))
    else
      echo -e "  ${C_RED}✘${C_RESET}  $fname  (copy failed)"
      ((fail++))
    fi
  done

  echo ""
  print_divider
  echo -e "  ${C_GREEN}${C_BOLD}Done!${C_RESET}  Uploaded: ${C_GREEN}$ok${C_RESET}  Failed: ${C_RED}$fail${C_RESET}"
  echo ""

  # ── optional git add ──────────────────────────────────────
  echo -e "  ${C_BOLD}Stage files in git? ${C_GREEN}Y${C_RESET}${C_BOLD}/${C_DIM}n${C_RESET}"
  IFS= read -rsn1 gitin
  if [[ "$gitin" == 'y' || "$gitin" == 'Y' || "$gitin" == '' ]]; then
    git -C "$REPO_ROOT" add "$target/"
    echo -e "  ${C_GREEN}✔${C_RESET}  Files staged. Run ${C_CYAN}git commit${C_RESET} when ready."
  fi

  echo ""
  echo -e "  ${C_BOLD}Press any key to continue...${C_RESET}"
  IFS= read -rsn1
}

# ── main loop ─────────────────────────────────────────────────
main() {
  declare -a packages
  collect_packages packages

  if [[ ${#packages[@]} -eq 0 ]]; then
    print_header
    echo -e "  ${C_RED}No packages with assets/snapshots/ found in MCPEDL.${C_RESET}\n"
    exit 1
  fi

  while true; do
    # -- check source dir -----------------------------------------
    declare -a images
    if ! collect_images images; then
      print_header
      echo -e "  ${C_RED}${C_BOLD}Source folder not found:${C_RESET}"
      echo -e "  ${C_DIM}$SOURCE_DIR${C_RESET}"
      echo ""
      echo -e "  Please create the folder and place your screenshot images inside it."
      echo ""
      echo -e "  ${C_BOLD}Press any key to retry  |  q to quit${C_RESET}"
      IFS= read -rsn1 k
      [[ "$k" == 'q' || "$k" == 'Q' ]] && exit 0
      unset images
      continue
    fi

    if [[ ${#images[@]} -eq 0 ]]; then
      print_header
      echo -e "  ${C_YELLOW}${C_BOLD}No images found in:${C_RESET}"
      echo -e "  ${C_DIM}$SOURCE_DIR${C_RESET}"
      echo ""
      echo -e "  ${C_DIM}Supported: .png  .jpg  .jpeg  .webp  .gif${C_RESET}"
      echo ""
      echo -e "  ${C_BOLD}Press any key to retry  |  q to quit${C_RESET}"
      IFS= read -rsn1 k
      [[ "$k" == 'q' || "$k" == 'Q' ]] && exit 0
      unset images
      continue
    fi

    # -- package picker -------------------------------------------
    local chosen_pkg
    menu_pick "Select a Package to upload snapshots into:" chosen_pkg "${packages[@]}"

    # -- upload ---------------------------------------------------
    do_upload "$chosen_pkg" images

    # -- loop menu ------------------------------------------------
    print_header
    echo -e "  ${C_BOLD}What would you like to do next?${C_RESET}\n"
    echo -e "  ${C_GREEN}[1]${C_RESET}  Upload to another package"
    echo -e "  ${C_GREEN}[2]${C_RESET}  Exit"
    echo ""
    IFS= read -rsn1 choice
    [[ "$choice" == '2' || "$choice" == 'q' || "$choice" == 'Q' ]] && break

    unset images
  done

  print_header
  echo -e "  ${C_DIM}Goodbye! 👋${C_RESET}\n"
}

main "$@"
