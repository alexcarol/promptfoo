"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const logger_1 = __importDefault(require("../logger"));
const server_1 = require("../util/server");
const server_2 = require("./server");
async function main() {
    const port = (0, constants_1.getDefaultPort)();
    const isRunning = await (0, server_1.checkServerRunning)(port);
    if (isRunning) {
        logger_1.default.info(`Promptfoo server already running at http://localhost:${port}`);
        process.exitCode = 1;
        return;
    }
    await (0, server_2.startServer)(port, server_1.BrowserBehavior.SKIP);
}
main().catch((err) => {
    logger_1.default.error(`Failed to start server: ${String(err)}`);
    process.exitCode = 1;
});
//# sourceMappingURL=index.js.map