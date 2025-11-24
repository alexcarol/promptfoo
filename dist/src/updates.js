"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestVersion = getLatestVersion;
exports.checkForUpdates = checkForUpdates;
exports.getModelAuditLatestVersion = getModelAuditLatestVersion;
exports.getModelAuditCurrentVersion = getModelAuditCurrentVersion;
exports.checkModelAuditUpdates = checkModelAuditUpdates;
const child_process_1 = require("child_process");
const util_1 = require("util");
const chalk_1 = __importDefault(require("chalk"));
const gt_1 = __importDefault(require("semver/functions/gt"));
const constants_1 = require("./constants");
const envars_1 = require("./envars");
const logger_1 = __importDefault(require("./logger"));
const index_1 = require("./util/fetch/index");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function getLatestVersion() {
    const response = await (0, index_1.fetchWithTimeout)(`https://api.promptfoo.dev/api/latestVersion`, {
        headers: { 'x-promptfoo-silent': 'true' },
    }, 10000);
    if (!response.ok) {
        throw new Error(`Failed to fetch package information for promptfoo`);
    }
    const data = (await response.json());
    return data.latestVersion;
}
async function checkForUpdates() {
    if ((0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_UPDATE')) {
        return false;
    }
    let latestVersion;
    try {
        latestVersion = await getLatestVersion();
    }
    catch {
        return false;
    }
    if ((0, gt_1.default)(latestVersion, constants_1.VERSION)) {
        const border = '='.repeat(constants_1.TERMINAL_MAX_WIDTH);
        logger_1.default.info(`\n${border}
${chalk_1.default.yellow('⚠️')} The current version of promptfoo ${chalk_1.default.yellow(constants_1.VERSION)} is lower than the latest available version ${chalk_1.default.green(latestVersion)}.

Please run ${chalk_1.default.green('npx promptfoo@latest')} or ${chalk_1.default.green('npm install -g promptfoo@latest')} to update.
${border}\n`);
        return true;
    }
    return false;
}
async function getModelAuditLatestVersion() {
    try {
        const response = await (0, index_1.fetchWithTimeout)('https://pypi.org/pypi/modelaudit/json', {
            headers: { 'x-promptfoo-silent': 'true' },
        }, 10000);
        if (!response.ok) {
            return null;
        }
        const data = (await response.json());
        return data.info.version;
    }
    catch {
        return null;
    }
}
async function getModelAuditCurrentVersion() {
    try {
        // Check the actual binary version (works with pip, pipx, or any installation method)
        const { stdout } = await execAsync('modelaudit --version');
        const versionMatch = stdout.match(/modelaudit,?\s+version\s+(\S+)/i);
        return versionMatch ? versionMatch[1] : null;
    }
    catch {
        return null;
    }
}
async function checkModelAuditUpdates() {
    if ((0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_UPDATE')) {
        return false;
    }
    const [currentVersion, latestVersion] = await Promise.all([
        getModelAuditCurrentVersion(),
        getModelAuditLatestVersion(),
    ]);
    if (!currentVersion || !latestVersion) {
        return false;
    }
    if ((0, gt_1.default)(latestVersion, currentVersion)) {
        const border = '='.repeat(constants_1.TERMINAL_MAX_WIDTH);
        logger_1.default.info(`\n${border}
${chalk_1.default.yellow('⚠️')} The current version of modelaudit ${chalk_1.default.yellow(currentVersion)} is lower than the latest available version ${chalk_1.default.green(latestVersion)}.

Please run ${chalk_1.default.green('pip install --upgrade modelaudit')} to update.
${border}\n`);
        return true;
    }
    return false;
}
//# sourceMappingURL=updates.js.map