import { ActionFormData } from "@minecraft/server-ui";
import { RECIPES } from "./recipe_registry.js";
import { evaluate, craft } from "./validator.js";
import { celebrate } from "./effects.js";

function altarCenter(block) {
  return { x: block.location.x + 0.5, y: block.location.y + 1.2, z: block.location.z + 0.5 };
}

async function openDetail(player, block, recipe) {
  const check = evaluate(player, recipe);
  const lines = check.lines.map((line) => {
    const color = line.have >= line.need ? "§a" : "§c";
    return `${color}${line.name}: ${line.have}/${line.need}§r`;
  });
  const form = new ActionFormData()
    .title(recipe.name)
    .body(`Ingredients:\n${lines.join("\n")}`)
    .button(check.ok ? "Fabricate" : "Missing ingredients")
    .button("Back");
  const response = await form.show(player);
  if (response.canceled || response.selection === undefined) {
    return;
  }
  if (response.selection === 1) {
    await openAltar(player, block);
    return;
  }
  const result = craft(player, recipe);
  if (!result.ok) {
    player.sendMessage(`§c${result.reason}`);
    return;
  }
  celebrate(block.dimension, altarCenter(block));
  player.sendMessage(`§6You fabricated ${recipe.output.count} ${recipe.name}.`);
}

export async function openAltar(player, block) {
  const form = new ActionFormData()
    .title("Fabrication Altar")
    .body("Choose an item to fabricate.");
  for (const recipe of RECIPES) {
    const ready = evaluate(player, recipe).ok;
    form.button(ready ? `§2[Ready]§r ${recipe.name}` : recipe.name);
  }
  const response = await form.show(player);
  if (response.canceled || response.selection === undefined) {
    return;
  }
  await openDetail(player, block, RECIPES[response.selection]);
}
