import { initCleanup } from "./lib/cleanup.js";
import { initRemote } from "./lib/remote.js";
import { initSenderLoop } from "./lib/sender_loop.js";
initRemote();
initSenderLoop();
initCleanup();
