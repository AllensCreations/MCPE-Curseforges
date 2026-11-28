import { system, world } from "@minecraft/server";
import { COMMAND, COOLDOWN_TICKS } from "./config.js";
import { scanLight } from "./light_scanner.js";

const cooling = new Set<string>();

export function registerLightCommand(): void {
  (world.beforeEvents as any).chatSend.subscribe((event: any) => {
    if (event.message.trim().toLowerCase() !== COMMAND) return;
    event.cancel = true;
    const player = event.sender;
    system.run(() => {
      if (cooling.has(player.id)) {
        player.sendMessage("Light overlay is still active. Wait a moment.");
        return;
      }
      cooling.add(player.id);
      system.runTimeout(() => {
        cooling.delete(player.id);
      }, COOLDOWN_TICKS);
      const result = scanLight(player);
      player.sendMessage(
        "Light overlay: " + result.unsafe + " unsafe (red, light 7 or lower), " + result.safe + " safe (green)."
      );
    });
  });
}
