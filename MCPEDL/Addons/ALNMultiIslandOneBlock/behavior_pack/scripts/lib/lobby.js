import { world } from "@minecraft/server";
import { LOBBY, PILLAR_TOP_Y, PILLAR_BOTTOM_Y } from "./config.js";
import { overworld, isLoaded, blockIdAt, runCmd, addArea, later } from "./util.js";

export function setupLobby() {
  try {
    world.setDefaultSpawnLocation({ x: LOBBY.x, y: LOBBY.y, z: LOBBY.z });
  } catch (e) {}
  try {
    world.gameRules.spawnRadius = 0;
  } catch (e) {}
  const dim = overworld();
  addArea(dim, "aln_lobby", LOBBY.x, PILLAR_TOP_Y, LOBBY.z);
  let tries = 0;
  const step = () => {
    tries++;
    if (isLoaded(dim, LOBBY.x, PILLAR_TOP_Y, LOBBY.z)) {
      if (blockIdAt(dim, LOBBY.x, PILLAR_TOP_Y, LOBBY.z) !== "minecraft:bedrock") {
        runCmd(dim, `fill ${LOBBY.x} ${PILLAR_BOTTOM_Y} ${LOBBY.z} ${LOBBY.x} ${PILLAR_TOP_Y} ${LOBBY.z} bedrock`);
      }
      return;
    }
    if (tries < 120) later(step, 10);
  };
  step();
}

export function teleportToLobby(player) {
  try {
    player.teleport({ x: LOBBY.x + 0.5, y: LOBBY.y, z: LOBBY.z + 0.5 }, { dimension: overworld() });
  } catch (e) {}
}
