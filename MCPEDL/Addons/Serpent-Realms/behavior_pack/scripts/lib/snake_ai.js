import { world } from "@minecraft/server";
import { onAnacondaHit } from "./anaconda_constrict.js";
import { onPythonHit, onPreyDeath } from "./python_digestion.js";

export function registerSnakeAI() {
  world.afterEvents.entityHitEntity.subscribe((event) => {
    onAnacondaHit(event);
    onPythonHit(event);
  });
  world.afterEvents.entityDie.subscribe((event) => {
    onPreyDeath(event);
  });
}
