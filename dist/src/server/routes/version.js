"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const constants_1 = require("../../constants");
const envars_1 = require("../../envars");
const updates_1 = require("../../updates");
const updateCommands_1 = require("../../updates/updateCommands");
const promptfooCommand_1 = require("../../util/promptfooCommand");
const logger_1 = __importDefault(require("../../logger"));
const router = express_1.default.Router();
// Cache for the latest version check
let versionCache = {
    latestVersion: null,
    timestamp: 0,
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
router.get('/', async (_req, res) => {
    try {
        const now = Date.now();
        let latestVersion = versionCache.latestVersion;
        // Check if cache is expired
        if (!latestVersion || now - versionCache.timestamp > CACHE_DURATION) {
            try {
                latestVersion = await (0, updates_1.getLatestVersion)();
                // Update cache
                versionCache = {
                    latestVersion,
                    timestamp: now,
                };
            }
            catch (error) {
                logger_1.default.debug(`Failed to fetch latest version: ${error}`);
                // If we can't get the latest version, return current version
                latestVersion = constants_1.VERSION;
                // Update cache timestamp even on failure to avoid hammering upstream
                versionCache = {
                    latestVersion,
                    timestamp: now,
                };
            }
        }
        const selfHosted = (0, envars_1.getEnvBool)('PROMPTFOO_SELF_HOSTED');
        const isNpx = (0, promptfooCommand_1.isRunningUnderNpx)();
        const updateCommands = (0, updateCommands_1.getUpdateCommands)({ selfHosted, isNpx });
        const response = {
            currentVersion: constants_1.VERSION,
            latestVersion,
            updateAvailable: latestVersion !== constants_1.VERSION && latestVersion !== null,
            selfHosted,
            isNpx,
            updateCommands,
            commandType: updateCommands.commandType,
        };
        res.json(response);
    }
    catch (error) {
        logger_1.default.error(`Error in version check endpoint: ${error}`);
        const selfHosted = (0, envars_1.getEnvBool)('PROMPTFOO_SELF_HOSTED');
        const isNpx = (0, promptfooCommand_1.isRunningUnderNpx)();
        const updateCommands = (0, updateCommands_1.getUpdateCommands)({ selfHosted, isNpx });
        res.status(500).json({
            error: 'Failed to check version',
            currentVersion: constants_1.VERSION,
            latestVersion: constants_1.VERSION,
            updateAvailable: false,
            selfHosted,
            isNpx,
            updateCommands,
            commandType: updateCommands.commandType,
        });
    }
});
exports.default = router;
//# sourceMappingURL=version.js.map