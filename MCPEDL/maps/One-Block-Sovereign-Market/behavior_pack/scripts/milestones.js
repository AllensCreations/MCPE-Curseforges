// milestones.js - milestones unlock titles; the chosen title (or your rank) shows above your head.
import { world, system } from "@minecraft/server";
import { getRankInfo } from "./economy.js";
import { getStat } from "./stats.js";
import { getTeamOf } from "./teams.js";

export const MILESTONES = [
  { title: "Digger", label: "Break the core once", ok: (p) => getStat(p, "breaks") >= 1 },
  { title: "Crusher", label: "Break the core 500 times", ok: (p) => getStat(p, "breaks") >= 500 },
  { title: "Contractor", label: "Complete 10 contracts", ok: (p) => getStat(p, "contracts") >= 10 },
  { title: "High Roller", label: "Open 10 crates", ok: (p) => getStat(p, "crates") >= 10 },
  { title: "Slayer", label: "Kill 10 wave monsters", ok: (p) => getStat(p, "kills") >= 10 },
  { title: "Teammate", label: "Join a team", ok: (p) => !!getTeamOf(p.id) },
  { title: "Tycoon", label: "Earn 250,000 coins in total", ok: (p) => getStat(p, "life") >= 250000 },
  { title: "Reborn", label: "Prestige once", ok: (p) => getStat(p, "prestige") >= 1 },
];

export const getTitle = (p) => { const t = p.getDynamicProperty("sv_title"); return typeof t === "string" ? t : ""; };
export function equipTitle(p, title) {
  const m = MILESTONES.find((x) => x.title === title);
  if (title === "" || (m && m.ok(p))) { p.setDynamicProperty("sv_title", title); return true; }
  return false;
}

export function initMilestones() {
  system.runInterval(() => {
    for (const p of world.getAllPlayers()) {
      if (!p.hasTag("void_cleaned")) continue;
      const title = getTitle(p) || getRankInfo(p).name;
      const tag = `§e[${title}]§r ${p.name}`;
      if (p.nameTag !== tag) p.nameTag = tag;
    }
  }, 100);
}
