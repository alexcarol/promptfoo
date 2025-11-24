"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redteamReportCommand = redteamReportCommand;
const constants_1 = require("../../constants");
const logger_1 = __importDefault(require("../../logger"));
const server_1 = require("../../server/server");
const telemetry_1 = __importDefault(require("../../telemetry"));
const index_1 = require("../../util/index");
const manage_1 = require("../../util/config/manage");
const server_2 = require("../../util/server");
function redteamReportCommand(program) {
    program
        .command('report [directory]')
        .description('Start browser UI and open to report')
        .option('-p, --port <number>', 'Port number', (0, constants_1.getDefaultPort)().toString())
        .option('--filter-description <pattern>', 'Filter evals by description using a regex pattern')
        .option('--env-file, --env-path <path>', 'Path to .env file')
        .action(async (directory, cmdObj) => {
        (0, index_1.setupEnv)(cmdObj.envPath);
        telemetry_1.default.record('command_used', {
            name: 'redteam report',
        });
        telemetry_1.default.record('redteam report', {});
        if (directory) {
            (0, manage_1.setConfigDirectoryPath)(directory);
        }
        if (cmdObj.filterDescription) {
            logger_1.default.warn('The --filter-description option is deprecated and not longer supported. The argument will be ignored.');
        }
        const isRunning = await (0, server_2.checkServerRunning)();
        if (isRunning) {
            await (0, server_2.openBrowser)(server_2.BrowserBehavior.OPEN_TO_REPORT);
        }
        else {
            await (0, server_1.startServer)(cmdObj.port, server_2.BrowserBehavior.OPEN_TO_REPORT);
        }
    });
}
//# sourceMappingURL=report.js.map