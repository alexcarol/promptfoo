"use strict";
/**
 * Run Command Registration
 *
 * Registers the 'run' subcommand with Commander.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCommand = runCommand;
const telemetry_1 = __importDefault(require("../../telemetry"));
/**
 * Register the run subcommand with Commander
 */
function runCommand(program) {
    program
        .command('run')
        .description('Scan code changes for LLM security vulnerabilities')
        .argument('[repo-path]', 'Repository path to scan', '.')
        .option('--api-key <key>', 'Promptfoo API key for authentication')
        .option('--base <ref>', 'Base branch or commit to compare against')
        .option('--compare <ref>', 'Compare branch or commit')
        .option('-c, --config <path>', 'Path to config file')
        .option('--api-host <url>', 'Promptfoo API host URL (default: https://api.promptfoo.app)')
        .option('--diffs-only', 'Scan only PR diffs, skip filesystem exploration')
        .option('--json', 'Output results as JSON')
        .option('--github-pr <owner/repo#number>', 'GitHub PR to post comments to')
        .option('--min-severity <level>', 'Minimum severity level (low|medium|high|critical)')
        .option('--minimum-severity <level>', 'Alias for min-severity (low|medium|high|critical)')
        .option('--guidance <text>', 'Custom guidance for the security scan')
        .option('--guidance-file <path>', 'Path to file containing custom guidance')
        .action(async (repoPath, cmdObj) => {
        telemetry_1.default.record('command_used', {
            name: 'code-scans run',
            diffsOnly: cmdObj.diffsOnly ?? false,
            hasGithubPr: !!cmdObj.githubPr,
            hasGuidance: !!(cmdObj.guidance || cmdObj.guidanceFile),
        });
        // lazy import so we only load the scanner's dependencies when needed
        const { executeScan } = await Promise.resolve().then(() => __importStar(require('../scanner/index')));
        await executeScan(repoPath, cmdObj);
    });
}
//# sourceMappingURL=run.js.map