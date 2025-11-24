"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEvalDelete = handleEvalDelete;
exports.handleEvalDeleteAll = handleEvalDeleteAll;
exports.deleteCommand = deleteCommand;
const confirm_1 = __importDefault(require("@inquirer/confirm"));
const logger_1 = __importDefault(require("../logger"));
const eval_1 = __importDefault(require("../models/eval"));
const telemetry_1 = __importDefault(require("../telemetry"));
const index_1 = require("../util/index");
const database_1 = require("../util/database");
async function handleEvalDelete(evalId, _envPath) {
    try {
        await (0, database_1.deleteEval)(evalId);
        logger_1.default.info(`Evaluation with ID ${evalId} has been successfully deleted.`);
    }
    catch (error) {
        logger_1.default.error(`Could not delete evaluation with ID ${evalId}:\n${error}`);
        process.exit(1);
    }
}
async function handleEvalDeleteAll() {
    const confirmed = await (0, confirm_1.default)({
        message: 'Are you sure you want to delete all stored evaluations? This action cannot be undone.',
    });
    if (!confirmed) {
        return;
    }
    await (0, database_1.deleteAllEvals)();
    logger_1.default.info('All evaluations have been deleted.');
}
function deleteCommand(program) {
    const deleteCommand = program
        .command('delete <id>')
        .description('Delete various resources')
        .option('--env-file, --env-path <path>', 'Path to .env file')
        .action(async (id, cmdObj) => {
        (0, index_1.setupEnv)(cmdObj.envPath);
        telemetry_1.default.record('command_used', {
            name: 'delete',
        });
        const evl = await (0, database_1.getEvalFromId)(id);
        if (evl) {
            return handleEvalDelete(id, cmdObj.envPath);
        }
        logger_1.default.error(`No resource found with ID ${id}`);
        process.exitCode = 1;
    });
    deleteCommand
        .command('eval <id>')
        .description('Delete an evaluation by ID. Use "latest" to delete the most recent evaluation, or "all" to delete all evaluations.')
        .option('--env-file, --env-path <path>', 'Path to .env file')
        .action(async (evalId, cmdObj) => {
        (0, index_1.setupEnv)(cmdObj.envPath);
        telemetry_1.default.record('command_used', {
            name: 'delete eval',
            evalId,
        });
        if (evalId === 'latest') {
            const latestResults = await eval_1.default.latest();
            if (latestResults) {
                await handleEvalDelete(latestResults.id, cmdObj.envPath);
            }
            else {
                logger_1.default.error('No eval found.');
                process.exitCode = 1;
            }
        }
        else if (evalId === 'all') {
            await handleEvalDeleteAll();
        }
        else {
            await handleEvalDelete(evalId, cmdObj.envPath);
        }
    });
}
//# sourceMappingURL=delete.js.map