import { world } from "@minecraft/server";
import { LOBBY, PILLAR_TOP_Y } from "./config.js";
import { overworld, addArea } from "./util.js";

export function setupLobby() {
  try {
    world.setDefaultSpawnLocation({ x: LOBBY.x, y: LOBBY.y, z: LOBBY.z });
  } catch (e) {}
  addArea(overworld(), "aln_lobby", LOBBY.x, PILLAR_TOP_Y, LOBBY.z);
}

export function teleportToLobby(player) {
  try {
    player.teleport({ x: LOBBY.x + 0.5, y: LOBBY.y, z: LOBBY.z + 0.5 }, { dimension: overworld() });
  } catch (e) {}
}
