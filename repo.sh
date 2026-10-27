#!/usr/bin/env bash
# repo.sh - splits the Controller into its own controller.js (Start + How to play + game info).
# Usage: run from the repo root:  bash repo.sh   (or: bash repo.sh /path/to/repo)
# Safe to run twice. Originals are saved in .controller-split-backup/
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

PY=python3
command -v python3 >/dev/null 2>&1 || PY=python
command -v "$PY" >/dev/null 2>&1 || { echo "Python is needed: pkg install python"; exit 1; }

for f in scripts/build_payload.py scripts/selftest_project_types.py scripts/check_generator_sync.py INSTRUCTIONS.md; do
  [ -f "$f" ] || { echo "Run this from the repo root. Missing: $f"; exit 1; }
done

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

BK=".controller-split-backup"
if [ ! -d "$BK" ]; then
  mkdir -p "$BK"
  cp scripts/build_payload.py scripts/selftest_project_types.py INSTRUCTIONS.md "$BK"/
  echo "Backup saved in $BK/"
fi

cat > "$WORK/controller.js" <<'CTRL_JS_EOF'
import { world, system, ItemStack, EntityComponentTypes, GameMode } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";

const CONTROLLER_ID = "allenscreations:controller";
const STATE_KEY = "game_state";
const OPERATOR_LEVEL = 2;

let config = null;
let registered = false;

const getState = () => {
  const v = world.getDynamicProperty(STATE_KEY);
  return typeof v === "string" ? v : "idle";
};
const setState = (s) => world.setDynamicProperty(STATE_KEY, s);
const isCreative = (player) => player.getGameMode() === GameMode.Creative;
const isHost = (player) => (typeof player.isOp === "function" ? player.isOp() : player.playerPermissionLevel === OPERATOR_LEVEL);
const containerOf = (player) => player.getComponent(EntityComponentTypes.Inventory)?.container;

function hasController(player) {
  const inv = containerOf(player);
  if (!inv) return false;
  for (let i = 0; i < inv.size; i++) {
    if (inv.getItem(i)?.typeId === CONTROLLER_ID) return true;
  }
  return false;
}

function giveController(player) {
  if (hasController(player)) return;
  containerOf(player)?.addItem(new ItemStack(CONTROLLER_ID, 1));
}

function consumeController(player) {
  if (isCreative(player)) return;
  const inv = containerOf(player);
  if (!inv) return;
  for (let i = 0; i < inv.size; i++) {
    if (inv.getItem(i)?.typeId === CONTROLLER_ID) {
      inv.setItem(i, undefined);
      player.playSound("random.break");
      player.sendMessage("The Controller broke.");
      return;
    }
  }
}

function runStart(player) {
  if (getState() === "running") {
    player.sendMessage("Already running.");
    return;
  }
  setState("running");
  consumeController(player);
  try {
    config.onStart(player);
  } catch (e) {
    setState("idle");
    giveController(player);
    player.sendMessage("The game could not start.");
  }
}

export function endGame() {
  if (getState() !== "running") return;
  setState("ended");
  try {
    config?.onEnd();
  } catch (e) {
    world.sendMessage("The game ended with an error.");
  }
  for (const p of world.getAllPlayers()) if (isHost(p)) giveController(p);
}

async function showHowToPlay(player) {
  const form = new ActionFormData().title("How to play").body(config.howToPlay).button("Back");
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (!res.canceled && res.selection === 0) openController(player);
}

async function openController(player, attempt = 0) {
  const note = isCreative(player) ? "Creative: the Controller is kept." : "Start uses up the Controller.";
  const form = new ActionFormData()
    .title(config.title)
    .body(`${config.gameInfo}\n\nState: ${getState()}\n${note}`)
    .button("Start")
    .button("How to play");
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (res.canceled) {
    if (res.cancelationReason === FormCancelationReason.UserBusy && attempt < 5) {
      system.runTimeout(() => openController(player, attempt + 1), 10);
    }
    return;
  }
  if (res.selection === 0) {
    runStart(player);
  } else if (res.selection === 1) {
    showHowToPlay(player);
  }
}

export function registerController(options) {
  if (registered) return;
  registered = true;
  config = {
    title: options?.title ?? "Controller",
    gameInfo: options?.gameInfo ?? "",
    howToPlay: options?.howToPlay ?? "",
    onStart: options?.onStart ?? (() => {}),
    onEnd: options?.onEnd ?? (() => {}),
  };

  world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
    if (itemStack?.typeId === CONTROLLER_ID && isHost(source)) openController(source);
  });

  system.afterEvents.scriptEventReceive.subscribe(({ id }) => {
    if (id === "allenscreations:end") endGame();
  });

  world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (!initialSpawn) return;
    if (isHost(player) && (isCreative(player) || getState() !== "running")) giveController(player);
  });
}
CTRL_JS_EOF

cat > "$WORK/main_sample.js" <<'MAIN_JS_EOF'
import { world } from "@minecraft/server";
import { registerController, endGame } from "./controller.js";

function win() {
  world.sendMessage("You won.");
  endGame();
}

registerController({
  title: "Sample Game",
  gameInfo: "Type: Challenge\nPlayers: 1 or more\nGoal: Replace this text with a short description of the game.",
  howToPlay: "Goal: replace this text.\nControls: replace this text.\nHow it ends: replace this text.",
  onStart: () => {
    world.sendMessage("Game started.");
  },
  onEnd: () => {
    world.sendMessage("Game ended.");
  },
});
MAIN_JS_EOF

cat > "$WORK/patch.py" <<'PATCH_PY_EOF'
import re
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()
src = Path(sys.argv[2]).resolve()
CJS = (src / "controller.js").read_text(encoding="utf-8").replace("\r\n", "\n")
MJS = (src / "main_sample.js").read_text(encoding="utf-8").replace("\r\n", "\n")
assert "'''" not in CJS and "'''" not in MJS
notes = []


def sub1(text, old, new, label):
    if old not in text:
        raise SystemExit(f"anchor not found: {label}")
    return text.replace(old, new, 1)


def rsub(text, pattern, new, label, flags=re.S):
    m = re.search(pattern, text, flags)
    if not m:
        raise SystemExit(f"anchor not found: {label}")
    return text[:m.start()] + new + text[m.end():]


bp = root / "scripts/build_payload.py"
t = bp.read_text(encoding="utf-8")
if "CONTROLLER_JS" in t:
    print("build_payload.py: already patched")
else:
    t = sub1(t, 'CONTROLLER_LABELS = ("Start", "How to play")\n',
             'CONTROLLER_LABELS = ("Start", "How to play")\nCONTROLLER_JS_REL = "behavior_pack/scripts/controller.js"\nCONTROLLER_JS = r\'\'\'' + CJS + '\'\'\'\n',
             "CONTROLLER_LABELS")
    t = sub1(t, '            print("installed  behavior_pack/functions/end_game.mcfunction")\n',
             '            print("installed  behavior_pack/functions/end_game.mcfunction")\n'
             '        mjs = root / "behavior_pack/scripts/main.js"\n'
             '        cjs = root / CONTROLLER_JS_REL\n'
             '        if not cjs.exists() and mjs.is_file() and "registerController(" in mjs.read_text(encoding="utf-8"):\n'
             '            cjs.parent.mkdir(parents=True, exist_ok=True)\n'
             '            cjs.write_text(CONTROLLER_JS, encoding="utf-8", newline="\\n")\n'
             '            print("installed  " + CONTROLLER_JS_REL)\n',
             "end_game install")
    new_checks = '''        mj = root / "behavior_pack/scripts/main.js"
        cj = root / CONTROLLER_JS_REL
        if mj.is_file():
            js = mj.read_text(encoding="utf-8")
            if "registerController(" in js:
                check(cj.is_file(), "missing required file: " + CONTROLLER_JS_REL)
                if cj.is_file():
                    check(cj.read_text(encoding="utf-8").replace("\\r\\n", "\\n") == CONTROLLER_JS,
                          "controller.js must be the unchanged generator copy")
                check(re.search(r"from\\s+[\\"']\\./controller\\.js[\\"']", js) is not None,
                      "main.js: must import registerController from ./controller.js")
                for key in ("gameInfo", "howToPlay"):
                    check(re.search(r"\\b" + key + r"\\s*:\\s*(?![\\"'`]{2})\\S", js) is not None,
                          f"main.js: registerController needs a non-empty {key}")
                check(re.search(r"\\bonStart\\s*[:(]", js) is not None, "main.js: registerController needs onStart")
                if "allenscreations:controller" in js:
                    warns.append("main.js mentions the controller item; controller.js already handles it")
            else:
                warns.append("main.js has an inline controller (legacy); move it to controller.js with registerController")
                check("allenscreations:controller" in js, "main.js never mentions allenscreations:controller")
                check("ActionFormData" in js, "main.js must open the controller with ActionFormData")
                btn = []
                for label in CONTROLLER_LABELS:
                    mt = re.search(r"\\.button\\(\\s*[\\"']" + label + r"[\\"']", js)
                    check(mt is not None, f"main.js: controller button '{label}' not found")
                    btn.append(mt.start() if mt else None)
                if all(x is not None for x in btn):
                    check(btn == sorted(btn), "main.js: controller buttons must be added in the order Start, How to play")
                check(re.search(r"\\.button\\(\\s*[\\"'](?:Restart|End)[\\"']", js) is None, "main.js: the controller form must not have Restart or End buttons")
                check(re.search(r"getGameMode\\(\\)\\s*[!=]==?\\s*GameMode\\.Creative", js) is not None,
                      "main.js: the controller must check GameMode.Creative with getGameMode()")
                check(re.search(r"\\.setItem\\(", js) is not None, "main.js: Start must consume the controller outside Creative (setItem)")
                check("scriptEventReceive" in js and "allenscreations:end" in js, "main.js: must handle the allenscreations:end script event")
            if "setInterval" in js or "system.runInterval" in js:
                warns.append("main.js uses a repeating timer; confirm it is not a per-tick scan")
'''
    t = rsub(t, r'        mj = root / "behavior_pack/scripts/main\.js"\n        if mj\.is_file\(\):\n.*?confirm it is not a per-tick scan"\)\n',
             new_checks, "controller checks")
    bp.write_text(t, encoding="utf-8")
    print("build_payload.py: patched")

st = root / "scripts/selftest_project_types.py"
t = st.read_text(encoding="utf-8")
if "unchanged generator copy" in t:
    print("selftest: already patched")
else:
    t = rsub(t, r"MAIN_JS = '''.*?'''\n", "MAIN_JS = r'''" + MJS + "'''\n", "MAIN_JS")
    t = rsub(t, r'        reject\("main\.js without the How to play button".*?\n', 
             '        reject("controller.js edited (How to play removed)", lambda d: write(d / "behavior_pack/scripts/controller.js", (d / "behavior_pack/scripts/controller.js").read_text().replace(\'.button("How to play")\', "")), "unchanged generator copy")\n', "reject1")
    t = rsub(t, r'        reject\("main\.js with an extra Restart button".*?\n',
             '        reject("main.js without gameInfo", lambda d: write(d / "behavior_pack/scripts/main.js", MAIN_JS.replace("gameInfo:", "gameinfo:")), "non-empty gameInfo")\n'
             '        reject("main.js with an empty howToPlay", lambda d: write(d / "behavior_pack/scripts/main.js", re.sub(r"howToPlay: \\"[^\\n]*\\",", "howToPlay: \\"\\",", MAIN_JS)), "non-empty howToPlay")\n', "reject2")
    if not re.search(r"^import re$", t, re.M):
        t = t.replace("import os\n", "import os\nimport re\n", 1)
    st.write_text(t, encoding="utf-8")
    print("selftest: patched")

md = root / "INSTRUCTIONS.md"
t = md.read_text(encoding="utf-8")
if "registerController" in t:
    print("INSTRUCTIONS.md: already patched")
else:
    t = rsub(t, r"^behavior_pack/scripts/main\.js$",
             "behavior_pack/scripts/main.js                  the game only; imports ./controller.js\nbehavior_pack/scripts/controller.js            fixed copy, installed by build_payload.py, never edited",
             "required files", re.M)
    t = sub1(t, "the script installs the six Controller files if missing", "the script installs the seven Controller files if missing", "six files")
    new_block = ("The Controller code lives in its own file, `behavior_pack/scripts/controller.js`. `build_payload.py` installs it when `main.js` calls `registerController(`, and the check fails if it differs from the generator copy, so never edit it. `main.js` holds only the game and connects to the two buttons through one call:\n\n"
                 "```js\n" + MJS.rstrip("\n") + "\n```\n\n"
                 "- `title`, `gameInfo` and `howToPlay` are required text. `gameInfo` tells the player what kind of game it is (type, players, goal) and is shown on the Controller form above the state line. `howToPlay` is the rules page behind the **How to play** button.\n"
                 "- **Start** runs `onStart(player)` after the Controller is consumed. If `onStart` throws, the state returns to `idle` and the Controller is given back.\n"
                 "- Call `endGame()` (imported from `./controller.js`) from your win or lose logic. It runs `onEnd()` and gives the host or operator a fresh Controller. The `allenscreations:end` script event does the same.\n"
                 "- Existing projects with an inline Controller in `main.js` still pass with a warning; move them to `registerController` when you next touch them.\n")
    t = rsub(t, r"Starting point for `main\.js`.*?```js\n.*?\n```\n", new_block, "main.js template")
    t = rsub(t, r"- \*\*How to play text\.\*\* Replace the `HOW_TO_PLAY` constant[^\n]*\n",
             "- **Info and rules text.** Fill `gameInfo` and `howToPlay` in `registerController` with the real game description and rules: goal, controls, and how it ends.\n", "how to play bullet")
    t = t.replace("`HOW_TO_PLAY` holds the real rules;", "`gameInfo` and `howToPlay` hold the real text;")
    t = sub1(t, "| `main.js: controller button '<label>' not found` | Keep the two labels `\"Start\"` and `\"How to play\"` in `main.js`. |",
             "| `controller.js must be the unchanged generator copy` | Delete `controller.js` and run `build_payload.py` again; do not edit it. |\n"
             "| `main.js: registerController needs a non-empty gameInfo` / `howToPlay` / `onStart` | Fill the fields in the `registerController({...})` call. |\n"
             "| `main.js: controller button '<label>' not found` | Legacy inline controller only: keep the two labels `\"Start\"` and `\"How to play\"`. |", "error row")
    md.write_text(t, encoding="utf-8")
    print("INSTRUCTIONS.md: patched")
PATCH_PY_EOF

"$PY" "$WORK/patch.py" . "$WORK"
"$PY" scripts/check_generator_sync.py --fix
"$PY" scripts/check_generator_sync.py

echo
echo "Running the self-test (needs the repo's Python packages; a failure here is not fatal)..."
if "$PY" scripts/selftest_project_types.py --fake-foundation; then
  echo "Self-test passed."
else
  echo "Self-test did not pass or could not run. Check the output above; originals are in $BK/"
fi

echo
echo "Done. New scripts now use controller.js; main.js calls registerController({ title, gameInfo, howToPlay, onStart, onEnd })."
echo "Review with: git diff --stat   then commit."
