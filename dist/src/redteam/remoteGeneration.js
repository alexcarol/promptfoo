"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemoteGenerationUrl = getRemoteGenerationUrl;
exports.neverGenerateRemote = neverGenerateRemote;
exports.neverGenerateRemoteForRegularEvals = neverGenerateRemoteForRegularEvals;
exports.buildRemoteUrl = buildRemoteUrl;
exports.getRemoteHealthUrl = getRemoteHealthUrl;
exports.getRemoteVersionUrl = getRemoteVersionUrl;
exports.shouldGenerateRemote = shouldGenerateRemote;
exports.getRemoteGenerationUrlForUnaligned = getRemoteGenerationUrlForUnaligned;
const cliState_1 = __importDefault(require("../cliState"));
const envars_1 = require("../envars");
const accounts_1 = require("../globalConfig/accounts");
const cloud_1 = require("../globalConfig/cloud");
/**
 * Gets the remote generation API endpoint URL.
 * Prioritizes: env var > cloud config > default endpoint.
 * @returns The remote generation URL
 */
function getRemoteGenerationUrl() {
    // Check env var first
    const envUrl = (0, envars_1.getEnvString)('PROMPTFOO_REMOTE_GENERATION_URL');
    if (envUrl) {
        return envUrl;
    }
    // If logged into cloud use that url + /task
    const cloudConfig = new cloud_1.CloudConfig();
    if (cloudConfig.isEnabled()) {
        return cloudConfig.getApiHost() + '/api/v1/task';
    }
    // otherwise use the default
    return 'https://api.promptfoo.app/api/v1/task';
}
/**
 * Check if remote generation should never be used.
 * Respects both the general and redteam-specific disable flags.
 * @returns true if remote generation is disabled
 */
function neverGenerateRemote() {
    // Check the general disable flag first (superset)
    if ((0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_REMOTE_GENERATION')) {
        return true;
    }
    // Fall back to the redteam-specific flag (subset)
    return (0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION');
}
/**
 * Check if remote generation should never be used for non-redteam features.
 * This allows granular control: disable redteam remote generation while allowing
 * regular SimulatedUser to use remote generation.
 * @returns true if ALL remote generation is disabled
 */
function neverGenerateRemoteForRegularEvals() {
    // Only respect the general disable flag for non-redteam features
    return (0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_REMOTE_GENERATION');
}
/**
 * Builds a remote URL with a substituted pathname, honoring env vars / cloud config.
 */
function buildRemoteUrl(pathname, fallback) {
    if (neverGenerateRemote()) {
        return null;
    }
    const envUrl = (0, envars_1.getEnvString)('PROMPTFOO_REMOTE_GENERATION_URL');
    if (envUrl) {
        try {
            const url = new URL(envUrl);
            url.pathname = pathname;
            return url.toString();
        }
        catch {
            return fallback;
        }
    }
    const cloudConfig = new cloud_1.CloudConfig();
    if (cloudConfig.isEnabled()) {
        return `${cloudConfig.getApiHost()}${pathname}`;
    }
    return fallback;
}
/**
 * Gets the URL for checking remote API health based on configuration.
 * @returns The health check URL, or null if remote generation is disabled.
 */
function getRemoteHealthUrl() {
    return buildRemoteUrl('/health', 'https://api.promptfoo.app/health');
}
/**
 * Gets the URL for checking remote API version based on configuration.
 * @returns The version check URL, or null if remote generation is disabled.
 */
function getRemoteVersionUrl() {
    return buildRemoteUrl('/version', 'https://api.promptfoo.app/version');
}
/**
 * Determines if remote generation should be used based on configuration.
 * @returns true if remote generation should be used
 */
function shouldGenerateRemote() {
    // If remote generation is explicitly disabled, respect that even for cloud users
    if (neverGenerateRemote()) {
        return false;
    }
    // If logged into cloud, prefer remote generation
    if ((0, accounts_1.isLoggedIntoCloud)()) {
        return true;
    }
    // Generate remotely when the user has not disabled it and does not have an OpenAI key.
    return !(0, envars_1.getEnvString)('OPENAI_API_KEY') || (cliState_1.default.remote ?? false);
}
/**
 * Gets the URL for unaligned model inference (harmful content generation).
 * Prioritizes: env var > cloud config > default endpoint.
 * @returns The unaligned inference URL
 */
function getRemoteGenerationUrlForUnaligned() {
    // Check env var first
    const envUrl = (0, envars_1.getEnvString)('PROMPTFOO_UNALIGNED_INFERENCE_ENDPOINT');
    if (envUrl) {
        return envUrl;
    }
    // If logged into cloud use that url + /task
    const cloudConfig = new cloud_1.CloudConfig();
    if (cloudConfig.isEnabled()) {
        return cloudConfig.getApiHost() + '/api/v1/task/harmful';
    }
    // otherwise use the default
    return 'https://api.promptfoo.app/api/v1/task/harmful';
}
//# sourceMappingURL=remoteGeneration.js.map