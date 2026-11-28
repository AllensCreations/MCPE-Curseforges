import { world } from "@minecraft/server";

export const DEBUG_CHAT = true;
const BUFFER_LIMIT = 200;
const PREFIX = "[ALN:CamouflageDoors]";
const COLORS = { ERROR: "§c", WARN: "§e", STEP: "§b", INFO: "§a" };
const buffer = [];

export function describeError(error) {
  if (error && error.message) {
    const stack = typeof error.stack === "string" ? error.stack.split("\n").slice(0, 3).join(" | ") : "";
    return error.message + (stack ? " @ " + stack : "");
  }
  return String(error);
}

function emit(level, moduleName, message) {
  const line = PREFIX + "[" + level + "][" + moduleName + "] " + message;
  buffer.push(line);
  if (buffer.length > BUFFER_LIMIT) {
    buffer.shift();
  }
  try {
    if (level === "ERROR") {
      console.error(line);
    } else if (level === "WARN") {
      console.warn(line);
    } else {
      console.log(line);
    }
  } catch (consoleError) {
    buffer.push(PREFIX + "[WARN][logger] console unavailable: " + describeError(consoleError));
  }
  if (DEBUG_CHAT) {
    try {
      world.sendMessage(COLORS[level] + line);
    } catch (chatError) {
      buffer.push(PREFIX + "[WARN][logger] chat unavailable: " + describeError(chatError));
    }
  }
}

export function getRecentLogs() {
  return buffer.slice();
}

export function createLogger(moduleName) {
  const logger = {
    info(message) {
      emit("INFO", moduleName, message);
    },
    step(message) {
      emit("STEP", moduleName, message);
    },
    warn(message) {
      emit("WARN", moduleName, message);
    },
    error(message) {
      emit("ERROR", moduleName, message);
    },
    guard(label, task) {
      try {
        const result = task();
        if (result && typeof result.catch === "function") {
          result.catch((error) => {
            emit("ERROR", moduleName, label + " failed (async): " + describeError(error));
          });
        }
        return result;
      } catch (error) {
        emit("ERROR", moduleName, label + " failed: " + describeError(error));
        return undefined;
      }
    },
  };
  return logger;
}
