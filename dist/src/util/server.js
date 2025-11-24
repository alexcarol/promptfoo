"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserBehavior = void 0;
exports.__clearFeatureCache = __clearFeatureCache;
exports.checkServerFeatureSupport = checkServerFeatureSupport;
exports.checkServerRunning = checkServerRunning;
exports.openBrowser = openBrowser;
exports.openAuthBrowser = openAuthBrowser;
const chalk_1 = __importDefault(require("chalk"));
const opener_1 = __importDefault(require("opener"));
const constants_1 = require("../constants");
const index_1 = require("./fetch/index");
const logger_1 = __importDefault(require("../logger"));
const remoteGeneration_1 = require("../redteam/remoteGeneration");
const readline_1 = require("./readline");
var BrowserBehavior;
(function (BrowserBehavior) {
    BrowserBehavior[BrowserBehavior["ASK"] = 0] = "ASK";
    BrowserBehavior[BrowserBehavior["OPEN"] = 1] = "OPEN";
    BrowserBehavior[BrowserBehavior["SKIP"] = 2] = "SKIP";
    BrowserBehavior[BrowserBehavior["OPEN_TO_REPORT"] = 3] = "OPEN_TO_REPORT";
    BrowserBehavior[BrowserBehavior["OPEN_TO_REDTEAM_CREATE"] = 4] = "OPEN_TO_REDTEAM_CREATE";
})(BrowserBehavior || (exports.BrowserBehavior = BrowserBehavior = {}));
// Cache for feature detection results to avoid repeated version checks
const featureCache = new Map();
/**
 * Clears the feature detection cache - used for testing
 * @internal
 */
function __clearFeatureCache() {
    featureCache.clear();
}
/**
 * Checks if a server supports a specific feature based on build date
 * @param featureName - Name of the feature (for caching and logging)
 * @param requiredBuildDate - Minimum build date when feature was added (ISO string)
 * @returns Promise<boolean> - true if server supports the feature
 */
async function checkServerFeatureSupport(featureName, requiredBuildDate) {
    const cacheKey = `${featureName}`;
    // Return cached result if available
    if (featureCache.has(cacheKey)) {
        return featureCache.get(cacheKey);
    }
    let supported = false;
    try {
        logger_1.default.debug(`[Feature Detection] Checking server support for feature: ${featureName}`);
        const versionUrl = (0, remoteGeneration_1.getRemoteVersionUrl)();
        if (versionUrl) {
            const response = await (0, index_1.fetchWithProxy)(versionUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.buildDate) {
                // Parse build date and check if it's after the required date
                const buildDate = new Date(data.buildDate);
                const featureDate = new Date(requiredBuildDate);
                supported = buildDate >= featureDate;
                logger_1.default.debug(`[Feature Detection] ${featureName}: buildDate=${data.buildDate}, required=${requiredBuildDate}, supported=${supported}`);
            }
            else {
                logger_1.default.debug(`[Feature Detection] ${featureName}: no version info, assuming not supported`);
                supported = false;
            }
        }
        else {
            logger_1.default.debug(`[Feature Detection] No remote URL available for ${featureName}, assuming local server supports it`);
            supported = true;
        }
    }
    catch (error) {
        logger_1.default.debug(`[Feature Detection] Version check failed for ${featureName}, assuming not supported: ${error}`);
        supported = false;
    }
    // Cache the result
    featureCache.set(cacheKey, supported);
    return supported;
}
async function checkServerRunning(port = (0, constants_1.getDefaultPort)()) {
    logger_1.default.debug(`Checking for existing server on port ${port}...`);
    try {
        const response = await (0, index_1.fetchWithProxy)(`http://localhost:${port}/health`, {
            headers: {
                'x-promptfoo-silent': 'true',
            },
        });
        const data = await response.json();
        return data.status === 'OK' && data.version === constants_1.VERSION;
    }
    catch (err) {
        logger_1.default.debug(`No existing server found - this is expected on first startup. ${String(err)}`);
        return false;
    }
}
async function openBrowser(browserBehavior, port = (0, constants_1.getDefaultPort)()) {
    const baseUrl = `http://localhost:${port}`;
    let url = baseUrl;
    if (browserBehavior === BrowserBehavior.OPEN_TO_REPORT) {
        url = `${baseUrl}/report`;
    }
    else if (browserBehavior === BrowserBehavior.OPEN_TO_REDTEAM_CREATE) {
        url = `${baseUrl}/redteam/setup`;
    }
    const doOpen = async () => {
        try {
            logger_1.default.info('Press Ctrl+C to stop the server');
            await (0, opener_1.default)(url);
        }
        catch (err) {
            logger_1.default.error(`Failed to open browser: ${String(err)}`);
        }
    };
    if (browserBehavior === BrowserBehavior.ASK) {
        const shouldOpen = await (0, readline_1.promptYesNo)('Open URL in browser?', false);
        if (shouldOpen) {
            await doOpen();
        }
    }
    else if (browserBehavior !== BrowserBehavior.SKIP) {
        await doOpen();
    }
}
/**
 * Opens authentication URLs in the browser with environment-aware behavior.
 *
 * @param authUrl - The login/signup URL to open in the browser
 * @param welcomeUrl - The URL where users can get their API token after login
 * @param browserBehavior - Controls how the browser opening is handled:
 *   - BrowserBehavior.ASK: Prompts user before opening (defaults to yes)
 *   - BrowserBehavior.OPEN: Opens browser automatically without prompting
 *   - BrowserBehavior.SKIP: Shows manual URLs without opening browser
 * @returns Promise that resolves when the operation completes
 *
 * @example
 * ```typescript
 * // Prompt user to open login page
 * await openAuthBrowser(
 *   'https://promptfoo.app',
 *   'https://promptfoo.app/welcome',
 *   BrowserBehavior.ASK
 * );
 * ```
 */
async function openAuthBrowser(authUrl, welcomeUrl, browserBehavior) {
    const doOpen = async () => {
        try {
            logger_1.default.info(`Opening ${authUrl} in your browser...`);
            await (0, opener_1.default)(authUrl);
            logger_1.default.info(`After logging in, get your API token at ${chalk_1.default.green(welcomeUrl)}`);
        }
        catch (err) {
            logger_1.default.error(`Failed to open browser: ${String(err)}`);
            // Fallback to showing URLs manually
            logger_1.default.info(`Please visit: ${chalk_1.default.green(authUrl)}`);
            logger_1.default.info(`After logging in, get your API token at ${chalk_1.default.green(welcomeUrl)}`);
        }
    };
    if (browserBehavior === BrowserBehavior.ASK) {
        const shouldOpen = await (0, readline_1.promptYesNo)('Open login page in browser?', true);
        if (shouldOpen) {
            await doOpen();
        }
        else {
            logger_1.default.info(`Please visit: ${chalk_1.default.green(authUrl)}`);
            logger_1.default.info(`After logging in, get your API token at ${chalk_1.default.green(welcomeUrl)}`);
        }
    }
    else if (browserBehavior === BrowserBehavior.SKIP) {
        logger_1.default.info(`Please visit: ${chalk_1.default.green(authUrl)}`);
        logger_1.default.info(`After logging in, get your API token at ${chalk_1.default.green(welcomeUrl)}`);
    }
    else {
        await doOpen();
    }
}
//# sourceMappingURL=server.js.map