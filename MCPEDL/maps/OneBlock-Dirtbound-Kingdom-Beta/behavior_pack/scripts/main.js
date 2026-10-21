import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const ORIGIN = { x: 0, y: 64, z: 0 };
const BEDROCK = { x: 0, y: 63, z: 0 };
const SPAWN = { x: 0.5, y: 65, z: 0.5 };
const TRADER_ITEM = "allenscreations:trader_ledger";
const COINS = "dirtbound_coins";
const MINED = "dirtbound_blocks";
const RECEIVED = "dirtbound_trader_received";

const SHOPS = [
 { name:"Castaway Supplies", unlock:0, items:[
  {name:"Oak Log ×1",id:"minecraft:oak_log",amount:1,price:10},
  {name:"Oak Planks ×8",id:"minecraft:oak_planks",amount:8,price:8},
  {name:"Bread ×3",id:"minecraft:bread",amount:3,price:15},
  {name:"Wheat Seeds ×4",id:"minecraft:wheat_seeds",amount:4,price:12},
  {name:"Cobblestone ×8",id:"minecraft:cobblestone",amount:8,price:25},
  {name:"Wooden Pickaxe ×1",id:"minecraft:wooden_pickaxe",amount:1,price:20},
  {name:"Torch ×4",id:"minecraft:torch",amount:4,price:12}
 ]},
 { name:"Settler Supplies", unlock:20, items:[
  {name:"Stone ×16",id:"minecraft:stone",amount:16,price:30},
  {name:"Oak Sapling ×2",id:"minecraft:oak_sapling",amount:2,price:35},
  {name:"Furnace ×1",id:"minecraft:furnace",amount:1,price:40},
  {name:"Chest ×2",id:"minecraft:chest",amount:2,price:30},
  {name:"Water Bucket ×1",id:"minecraft:water_bucket",amount:1,price:100},
  {name:"Carrot ×4",id:"minecraft:carrot",amount:4,price:35},
  {name:"Iron Ingot ×2",id:"minecraft:iron_ingot",amount:2,price:100}
 ]},
 { name:"Adventurer Supplies", unlock:50, items:[
  {name:"Iron Pickaxe ×1",id:"minecraft:iron_pickaxe",amount:1,price:220},
  {name:"Shield ×1",id:"minecraft:shield",amount:1,price:300},
  {name:"Bow ×1",id:"minecraft:bow",amount:1,price:250},
  {name:"Arrow ×16",id:"minecraft:arrow",amount:16,price:100},
  {name:"Glass ×16",id:"minecraft:glass",amount:16,price:90},
  {name:"Lantern ×4",id:"minecraft:lantern",amount:4,price:100},
  {name:"Diamond ×1",id:"minecraft:diamond",amount:1,price:450}
 ]}
];

function objective(name) {
 return world.scoreboard.getObjective(name) ?? world.scoreboard.addObjective(name,name);
}
function score(name,player) {
 try { const id=player.scoreboardIdentity; return id ? (objective(name).getScore(id) ?? 0) : 0; }
 catch { return 0; }
}
function hasScore(name,player) {
 try { const id=player.scoreboardIdentity; return !!id && objective(name).getScore(id)!==undefined; }
 catch { return false; }
}
function setScore(name,player,value) {
 const id=player.scoreboardIdentity;
 if(id) objective(name).setScore(id,Math.max(0,Math.floor(value)));
}
const balance=p=>score(COINS,p);
const mined=p=>score(MINED,p);
function tell(player,message) { try { player.sendMessage("§6[Dirtbound] §f"+message); } catch {} }

function maintainOneBlock() {
 try {
  const dim=world.getDimension("overworld");
  if(dim.getBlock(BEDROCK)?.typeId!=="minecraft:bedrock") dim.getBlock(BEDROCK)?.setType("minecraft:bedrock");
  if(dim.getBlock(ORIGIN)?.typeId!=="minecraft:dirt") dim.getBlock(ORIGIN)?.setType("minecraft:dirt");
  world.setDefaultSpawnLocation({x:0,y:65,z:0});
 } catch {}
}
function giveTrader(player) {
 const inventory=player.getComponent("minecraft:inventory")?.container;
 if(!inventory) return;
 try {
  const leftover=inventory.addItem(new ItemStack(TRADER_ITEM,1));
  if(leftover) { tell(player,"Make room in your inventory to receive the OneBlock Trader."); return; }
  setScore(RECEIVED,player,1);
  tell(player,"You received the OneBlock Trader. Hold it and interact to open the Trading UI.");
 } catch { tell(player,"The Trader item could not be delivered. Make inventory space and rejoin."); }
}
function initializePlayer(player) {
 if(!hasScore(COINS,player)) setScore(COINS,player,50);
 if(!hasScore(MINED,player)) setScore(MINED,player,0);
 if(!hasScore(RECEIVED,player)) giveTrader(player);
}
function showTradingUI(player) {
 const form=new ActionFormData().title("ONEBLOCK TRADING POST")
  .body("OneCoins: §e"+balance(player)+"§r\nBlocks mined: "+mined(player)+"\n\nTrade Dirt for coins or buy supplies to grow your island.\nPhase 2 unlocks at 20 blocks; Phase 3 at 50.");
 form.button("Buy Supplies"); form.button("Sell All Dirt"); form.button("Balance & Progress");
 form.show(player).then(r=>{
  if(r.canceled) return;
  if(r.selection===0) showShop(player);
  else if(r.selection===1) sellDirt(player);
  else tell(player,"Balance: "+balance(player)+" OneCoins. Blocks mined: "+mined(player)+". Phase 2: 20 blocks. Phase 3: 50 blocks.");
 }).catch(()=>tell(player,"The Trading UI could not open. Interact with the Trader again."));
}
function showShop(player) {
 const count=mined(player);
 const form=new ActionFormData().title("SUPPLY SHOP").body("Balance: "+balance(player)+" OneCoins\nChoose a supply category.");
 for(const shop of SHOPS) form.button(count>=shop.unlock ? shop.name : shop.name+"\n§8Unlock at "+shop.unlock+" blocks");
 form.button("Back");
 form.show(player).then(r=>{
  if(r.canceled) return;
  if(r.selection===SHOPS.length) return showTradingUI(player);
  const shop=SHOPS[r.selection]; if(!shop) return;
  if(count<shop.unlock) { tell(player,shop.name+" unlocks after "+shop.unlock+" blocks mined."); return showShop(player); }
  showProducts(player,shop);
 }).catch(()=>tell(player,"The Supply Shop could not open."));
}
function showProducts(player,shop) {
 const form=new ActionFormData().title(shop.name).body("Balance: "+balance(player)+" OneCoins\nChoose an item to purchase.");
 for(const item of shop.items) form.button(item.name+"\n§e"+item.price+" OneCoins");
 form.button("Back to Categories");
 form.show(player).then(r=>{
  if(r.canceled) return;
  if(r.selection===shop.items.length) return showShop(player);
  const item=shop.items[r.selection]; if(item) purchase(player,item,shop);
 }).catch(()=>tell(player,"The item list could not open."));
}
function purchase(player,item,shop) {
 if(mined(player)<shop.unlock) return tell(player,"That supply category is still locked.");
 const funds=balance(player);
 if(funds<item.price) return tell(player,"Not enough OneCoins. You need "+item.price+" and have "+funds+".");
 const inventory=player.getComponent("minecraft:inventory")?.container;
 if(!inventory || inventory.emptySlotsCount<1) return tell(player,"Make at least one free inventory slot before purchasing.");
 try {
  const leftover=inventory.addItem(new ItemStack(item.id,item.amount));
  const delivered=item.amount-(leftover?.amount ?? 0);
  if(delivered<=0) return tell(player,"Your inventory cannot fit that purchase. No coins were taken.");
  const charged=Math.ceil(item.price*delivered/item.amount);
  setScore(COINS,player,funds-charged);
  tell(player,leftover ? "Limited space: delivered "+delivered+" item(s), charged "+charged+" OneCoins." : "Purchased "+item.name+" for "+charged+" OneCoins. Balance: "+balance(player)+".");
 } catch { tell(player,"The purchase failed. No coins were taken."); }
}
function sellDirt(player) {
 const inventory=player.getComponent("minecraft:inventory")?.container;
 if(!inventory) return tell(player,"Your inventory could not be accessed.");
 let sold=0;
 for(let slot=0;slot<inventory.size;slot++) {
  const stack=inventory.getItem(slot);
  if(stack?.typeId!=="minecraft:dirt") continue;
  sold+=stack.amount; inventory.setItem(slot,undefined);
 }
 if(!sold) return tell(player,"You have no Dirt to sell. Break the central OneBlock first.");
 setScore(COINS,player,balance(player)+sold);
 tell(player,"Sold "+sold+" Dirt for "+sold+" OneCoins. Balance: "+balance(player)+".");
}
world.afterEvents.itemUse.subscribe(event=>{
 if(event.itemStack?.typeId!==TRADER_ITEM) return;
 const player=event.source;
 if(!player || player.typeId!=="minecraft:player") return;
 system.run(()=>showTradingUI(player));
});
world.afterEvents.playerBreakBlock.subscribe(event=>{
 const b=event.block;
 if(b.dimension.id!=="minecraft:overworld" || b.x!==ORIGIN.x || b.y!==ORIGIN.y || b.z!==ORIGIN.z) return;
 const player=event.player; if(!player) return;
 system.run(()=>{
  maintainOneBlock();
  const count=mined(player)+1; setScore(MINED,player,count);
  for(const shop of SHOPS) if(shop.unlock>0 && shop.unlock===count) tell(player,"New shop unlocked: "+shop.name+"!");
 });
});
world.afterEvents.playerSpawn.subscribe(event=>{
 system.runTimeout(()=>{
  initializePlayer(event.player); maintainOneBlock();
  if(event.initialSpawn) try { event.player.teleport(SPAWN,{dimension:world.getDimension("overworld"),checkForBlocks:false}); } catch {}
 },10);
});
system.runInterval(()=>{
 for(const player of world.getAllPlayers()) {
  try { player.onScreenDisplay.setActionBar("§6Dirtbound Kingdom §8| §fBlocks: "+mined(player)+" §8| §eOneCoins: "+balance(player)); } catch {}
 }
},100);
system.run(()=>{ objective(COINS); objective(MINED); objective(RECEIVED); maintainOneBlock(); });
