import { world, system, ItemStack, BlockPermutation } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { createLogger, describeError } from "./logger.js";
import { PAINTED_DOOR_ID, PALETTE } from "./palette.js";

const log = createLogger("diagnostics");
let summary = "ALN:CamouflageDoors diagnostics have not run yet.";

function buildChecks() {
  return [
    ["system.beforeEvents.startup", () => typeof system.beforeEvents.startup.subscribe === "function"],
    ["world.beforeEvents.playerInteractWithBlock", () => typeof world.beforeEvents.playerInteractWithBlock.subscribe === "function"],
    ["world.afterEvents.playerPlaceBlock", () => typeof world.afterEvents.playerPlaceBlock.subscribe === "function"],
    ["world.afterEvents.playerBreakBlock", () => typeof world.afterEvents.playerBreakBlock.subscribe === "function"],
    ["world.afterEvents.playerLeave", () => typeof world.afterEvents.playerLeave.subscribe === "function"],
    ["world.afterEvents.playerSpawn", () => typeof world.afterEvents.playerSpawn.subscribe === "function"],
    ["world.sendMessage", () => typeof world.sendMessage === "function"],
    ["ItemStack.setDynamicProperty", () => typeof ItemStack.prototype.setDynamicProperty === "function"],
    ["ItemStack.getDynamicProperty", () => typeof ItemStack.prototype.getDynamicProperty === "function"],
    ["ItemStack.setLore", () => typeof ItemStack.prototype.setLore === "function"],
    ["BlockPermutation.resolve", () => typeof BlockPermutation.resolve === "function"],
    ["ActionFormData.button and show", () => typeof ActionFormData.prototype.button === "function" && typeof ActionFormData.prototype.show === "function"],
    ["block aln:door_painter is registered", () => BlockPermutation.resolve("aln:door_painter") !== undefined],
    ["block aln:painted_door is registered", () => BlockPermutation.resolve(PAINTED_DOOR_ID) !== undefined],
    [
      "painted door states accept every palette key",
      () => {
        for (const entry of PALETTE) {
          BlockPermutation.resolve(PAINTED_DOOR_ID, {
            "aln:half": "lower",
            "aln:tex": entry.key,
            "aln:kind": "wood",
            "aln:dir": "north",
            "aln:open": false,
          });
        }
        return true;
      },
    ],
  ];
}

export function runDiagnostics() {
  const checks = buildChecks();
  let passed = 0;
  const failures = [];
  for (const [label, check] of checks) {
    try {
      if (check()) {
        passed += 1;
        log.info("PASS " + label);
      } else {
        failures.push(label);
        log.error("FAIL " + label + " (returned false)");
      }
    } catch (error) {
      failures.push(label);
      log.error("FAIL " + label + ": " + describeError(error));
    }
  }
  summary = "ALN:CamouflageDoors diagnostics: " + passed + "/" + checks.length + " passed" + (failures.length ? ". Failed: " + failures.join(", ") : ".");
  log.step(summary);
}

export function initDiagnostics() {
  log.guard("run diagnostics", () => runDiagnostics());
  log.guard("subscribe playerSpawn", () => {
    world.afterEvents.playerSpawn.subscribe((event) => {
      if (event.initialSpawn) {
        event.player.sendMessage((summary.includes("Failed") ? "§c" : "§a") + summary);
      }
    });
  });
}
