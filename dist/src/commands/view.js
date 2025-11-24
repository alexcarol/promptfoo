"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.viewCommand = viewCommand;
const constants_1 = require("../constants");
const logger_1 = __importDefault(require("../logger"));
const server_1 = require("../server/server");
const telemetry_1 = __importDefault(require("../telemetry"));
const index_1 = require("../util/index");
const manage_1 = require("../util/config/manage");
const server_2 = require("../util/server");
function viewCommand(program) {
    program
        .command('view [directory]')
        .description('Start browser UI')
        .option('-p, --port <number>', 'Port number', (val) => Number.parseInt(val, 10), (0, constants_1.getDefaultPort)())
        .option('-y, --yes', 'Skip confirmation and auto-open the URL')
        .option('-n, --no', 'Skip confirmation and do not open the URL')
        .option('--filter-description <pattern>', 'Filter evals by description using a regex pattern')
        .option('--env-file, --env-path <path>', 'Path to .env file')
        .action(async (directory, cmdObj) => {
        (0, index_1.setupEnv)(cmdObj.envPath);
        telemetry_1.default.record('command_used', {
            name: 'view',
        });
        if (cmdObj.filterDescription) {
            logger_1.default.warn('The --filter-description option is deprecated and not longer supported. The argument will be ignored.');
        }
        if (directory) {
            (0, manage_1.setConfigDirectoryPath)(directory);
        }
        // Determine browser behavior
        const browserBehavior = cmdObj.yes
            ? server_2.BrowserBehavior.OPEN
            : cmdObj.no
                ? server_2.BrowserBehavior.SKIP
                : server_2.BrowserBehavior.ASK;
        await (0, server_1.startServer)(cmdObj.port, browserBehavior);
    });
}
//# sourceMappingURL=view.js.map