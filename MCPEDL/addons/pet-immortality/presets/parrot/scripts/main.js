import { world } from "@minecraft/server";

function isProtected(entity) {
    try {
        if (entity.typeId !== "minecraft:parrot") return false;
        const tameable = entity.getComponent("minecraft:tameable");
        return Boolean(tameable && tameable.isTamed);
    } catch {
        return false;
    }
}

world.beforeEvents.entityHurt.subscribe((event) => {
    if (isProtected(event.hurtEntity)) {
        event.cancel = true;
    }
});
