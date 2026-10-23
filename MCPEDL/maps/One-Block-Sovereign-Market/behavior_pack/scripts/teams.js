// teams.js - small co-op teams (max 4): shared worker vault and shared permit level.
import { world } from "@minecraft/server";

export const MAX_TEAM = 4;
const read = (key, fb) => {
  const raw = world.getDynamicProperty(key);
  if (typeof raw !== "string") return fb;
  try { const v = JSON.parse(raw); return v && typeof v === "object" ? v : fb; } catch { return fb; }
};
const write = (key, v) => world.setDynamicProperty(key, JSON.stringify(v));
// teams: { id: { n: name, o: ownerId, m: [{i, n}], p: permitLevel } }   map: { playerId: teamId }

export function getTeamOf(pid) {
  const tid = read("sv_teammap", {})[pid];
  const t = tid ? read("sv_teams", {})[tid] : null;
  return t ? { id: tid, name: t.n, owner: t.o, members: t.m, permit: t.p ?? 0 } : null;
}
/** Key used for the worker vault: team vault if in a team, otherwise a personal one. */
export const vaultKey = (pid) => { const t = getTeamOf(pid); return t ? `t:${t.id}` : `p:${pid}`; };
export const teamPermit = (pid) => getTeamOf(pid)?.permit ?? 0;
export function setTeamPermit(pid, level) {
  const t = getTeamOf(pid);
  if (!t || level <= t.permit) return;
  const all = read("sv_teams", {});
  all[t.id].p = level;
  write("sv_teams", all);
}

export function createTeam(player, rawName) {
  const name = String(rawName ?? "").trim().replace(/[^A-Za-z0-9 ]/g, "").slice(0, 16);
  if (name.length < 3) return { ok: false, msg: "Team name needs 3-16 letters or numbers." };
  if (getTeamOf(player.id)) return { ok: false, msg: "You are already in a team." };
  const all = read("sv_teams", {});
  if (Object.values(all).some((t) => t.n.toLowerCase() === name.toLowerCase())) return { ok: false, msg: "That team name is taken." };
  const id = `${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  all[id] = { n: name, o: player.id, m: [{ i: player.id, n: player.name }], p: 0 };
  write("sv_teams", all);
  const map = read("sv_teammap", {}); map[player.id] = id; write("sv_teammap", map);
  return { ok: true, msg: `Team ${name} created.` };
}
export function addMember(teamId, player) {
  const all = read("sv_teams", {});
  const t = all[teamId];
  if (!t || t.m.length >= MAX_TEAM || getTeamOf(player.id)) return false;
  t.m.push({ i: player.id, n: player.name });
  write("sv_teams", all);
  const map = read("sv_teammap", {}); map[player.id] = teamId; write("sv_teammap", map);
  return true;
}
export function leaveTeam(player) {
  const t = getTeamOf(player.id);
  if (!t) return;
  const all = read("sv_teams", {});
  const team = all[t.id];
  team.m = team.m.filter((x) => x.i !== player.id);
  if (team.m.length === 0) delete all[t.id]; else if (team.o === player.id) team.o = team.m[0].i;
  write("sv_teams", all);
  const map = read("sv_teammap", {}); delete map[player.id]; write("sv_teammap", map);
}
