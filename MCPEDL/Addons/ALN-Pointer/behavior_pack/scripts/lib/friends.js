import { world } from "@minecraft/server";
import { PLAYER_ID } from "./info.js";
import { readSaved, writeSaved } from "./saved.js";

const KEY = "aln_pointer_friends";

export const isFriend = (owner, other) => other.typeId === PLAYER_ID && readSaved(owner, KEY)[other.id] !== undefined;
export const friendNames = (player) => Object.values(readSaved(player, KEY));
export const others = (player) => world.getAllPlayers().filter((p) => p.id !== player.id);

export function applyFriends(player, shown, values) {
  const data = { ...readSaved(player, KEY) };
  shown.forEach((p, i) => {
    if (values[i] === true) data[p.id] = p.name;
    else delete data[p.id];
  });
  writeSaved(player, KEY, data);
}
