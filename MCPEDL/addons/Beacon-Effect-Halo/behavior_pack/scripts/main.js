import { world, system, EquipmentSlot, BlockVolume } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const FULL_CHARGE = 600, UPDATE_TICKS = 20, SCAN_TICKS = 200;
const HALOS = [
  { id: "beaconhalo:haste_halo", label: "Haste Halo", effect: "haste" },
  { id: "beaconhalo:speed_halo", label: "Speed Halo", effect: "speed" },
  { id: "beaconhalo:resistance_halo", label: "Resistance Halo", effect: "resistance" },
  { id: "beaconhalo:jump_boost_halo", label: "Jump Boost Halo", effect: "jump_boost" },
  { id: "beaconhalo:strength_halo", label: "Strength Halo", effect: "strength" },
  { id: "beaconhalo:regeneration_halo", label: "Regeneration Halo", effect: "regeneration" }
];
const byId = new Map(HALOS.map(h => [h.id, h]));
const beaconCache = new Map(), particleTick = new Map();
function inv(p) { try { return p.getComponent("minecraft:inventory")?.container; } catch { return undefined; } }
function gear(p) { try { return p.getComponent("minecraft:equippable"); } catch { return undefined; } }
function charge(item) {
  try { const line = item.getLore().find(s => s.startsWith("§7Charge: ")); const m = line?.match(/Charge: (\d+)/); return m ? Math.max(0, Math.min(FULL_CHARGE, Number(m[1]))) : 0; } catch { return 0; }
}
function setCharge(item, seconds) {
  try { const lore = item.getLore().filter(s => !s.startsWith("§7Charge: ")); lore.push(`§7Charge: ${Math.max(0, Math.min(FULL_CHARGE, Math.floor(seconds)))}s / 600s`); item.setLore(lore); return true; } catch { return false; }
}
function notify(p, msg) { try { p.onScreenDisplay.setActionBar("§6Beacon Halo§r: " + msg); } catch { try { p.sendMessage("Beacon Halo: " + msg); } catch {} } }
function time(s) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; }
function showChargeForm(p) {
  const list = [];
  const container = inv(p);
  if (container) for (let slot=0; slot<container.size; slot++) {
    const item = container.getItem(slot), halo = item && byId.get(item.typeId);
    if (halo) list.push({slot, halo, charge:charge(item)});
  }
  const form = new ActionFormData().title("Beacon Halo Charging").body(list.length ? "Choose a halo to restore its full 10-minute charge." : "Bring a Beacon Effect Halo in your inventory to charge it.");
  if (list.length) { for (const e of list) form.button(`${e.halo.label}\nCharge: ${time(e.charge)} / 10:00`); form.button("Cancel"); }
  else form.button("Close");
  form.show(p).then(result => {
    if (result.canceled || !list.length || result.selection >= list.length) return;
    const e=list[result.selection], c=inv(p), item=c?.getItem(e.slot);
    if (!item || item.typeId!==e.halo.id || !setCharge(item,FULL_CHARGE)) { notify(p,"Could not charge that halo. Try again."); return; }
    try { c.setItem(e.slot,item); notify(p,e.halo.label+" fully charged."); } catch { notify(p,"Could not save the charge. Try again."); }
  }).catch(() => notify(p,"Charging interface could not be opened."));
}
world.afterEvents.playerInteractWithBlock.subscribe(e => {
  try { if (e.block.typeId==="minecraft:beacon") system.run(()=>{try{if(e.player.isValid())showChargeForm(e.player);}catch{}}); } catch {}
});
const BASE = new Set(["minecraft:iron_block","minecraft:gold_block","minecraft:emerald_block","minecraft:diamond_block","minecraft:netherite_block"]);
function pyramid(dim,x,y,z) {
  let level=0;
  for(let n=1;n<=4;n++){let ok=true;for(let dx=-n;dx<=n&&ok;dx++)for(let dz=-n;dz<=n;dz++){try{const b=dim.getBlock({x:x+dx,y:y-n,z:z+dz});if(!b||!BASE.has(b.typeId)){ok=false;break;}}catch{ok=false;break;}}if(!ok)break;level=n;}
  return level;
}
function beamClear(dim,x,y,z) {
  for(let dy=1;dy<=12;dy++){try{const b=dim.getBlock({x,y:y+dy,z}),id=b?.typeId;if(!id)return false;if(id!=="minecraft:air"&&id!=="minecraft:glass"&&id!=="minecraft:glass_pane"&&!id.endsWith("_stained_glass")&&!id.endsWith("_stained_glass_pane"))return false;}catch{return false;}}
  return true;
}
function scanBeacon(p) {
  const pos = p.location;
  const x = Math.floor(pos.x), y = Math.floor(pos.y), z = Math.floor(pos.z);
  const dim = p.dimension;
  let candidates;
  try {
    const volume = new BlockVolume(
      { x: x - 50, y: y - 50, z: z - 50 },
      { x: x + 50, y: y + 50, z: z + 50 }
    );
    // Engine-side block filtering is substantially cheaper than manually reading every block.
    // allowUnloadedChunks=true limits the query to currently loaded chunks.
    candidates = dim.getBlocks(volume, { includeTypes: ["minecraft:beacon"] }, true);
  } catch {
    return null;
  }
  try {
    for (const location of candidates.getBlockLocationIterator()) {
      let block;
      try { block = dim.getBlock(location); } catch { continue; }
      if (!block || block.typeId !== "minecraft:beacon") continue;
      const bx = location.x, by = location.y, bz = location.z;
      const level = pyramid(dim, bx, by, bz);
      if (!level || !beamClear(dim, bx, by, bz)) continue;
      const range = [0, 20, 30, 40, 50][level];
      const horizontal = Math.max(Math.abs(pos.x - bx - 0.5), Math.abs(pos.z - bz - 0.5));
      const vertical = Math.abs(pos.y - by - 0.5);
      if (horizontal <= range && vertical <= range) return { x: bx, y: by, z: bz, level };
    }
  } catch {}
  return null;
}
function powered(p,tick) {
  const old=beaconCache.get(p.id);
  if(old&&old.dim===p.dimension.id&&tick-old.tick<SCAN_TICKS)return !!old.beacon;
  const beacon=scanBeacon(p);beaconCache.set(p.id,{tick,dim:p.dimension.id,beacon});return !!beacon;
}
function update(p,halo,isPowered) {
  const eq=gear(p);let item;try{item=eq?.getEquipment(EquipmentSlot.Head);}catch{return;}
  if(!item||item.typeId!==halo.id)return;
  let remaining=charge(item);if(!isPowered&&remaining<=0)return;
  try{p.addEffect(halo.effect,80,{amplifier:0,showParticles:false});}catch{}
  if(!isPowered&&system.currentTick%UPDATE_TICKS===0){remaining=Math.max(0,remaining-1);if(setCharge(item,remaining))try{eq.setEquipment(EquipmentSlot.Head,item);}catch{}if(remaining===0)notify(p,halo.label+" charge depleted. Recharge it at a Beacon.");}
  const last=particleTick.get(p.id)??-100;
  if(system.currentTick-last>=10){try{p.dimension.spawnParticle("minecraft:totem_particle",{x:p.location.x,y:p.location.y+2.2,z:p.location.z});particleTick.set(p.id,system.currentTick);}catch{}}
}
system.runInterval(()=>{let players;try{players=world.getAllPlayers();}catch{return;}const tick=system.currentTick;for(const p of players)try{const item=gear(p)?.getEquipment(EquipmentSlot.Head),halo=item&&byId.get(item.typeId);if(halo)update(p,halo,powered(p,tick));}catch{}},UPDATE_TICKS);
world.afterEvents.playerLeave.subscribe(e=>{beaconCache.delete(e.playerId);particleTick.delete(e.playerId);});
console.warn("[Beacon Effect Halo] Six halo types initialized.");
