"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeScansCommand = codeScansCommand;
const run_1 = require("./commands/run");
/**
 * Register the code-scans command group
 * Pattern matches redteam command structure
 */
function codeScansCommand(program) {
    const codeScansCommand = program
        .command('code-scans')
        .description('Scan code for LLM security vulnerabilities');
    // Register subcommands
    (0, run_1.runCommand)(codeScansCommand);
}
//# sourceMappingURL=index.js.map