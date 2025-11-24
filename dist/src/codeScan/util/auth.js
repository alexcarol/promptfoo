"use strict";
/**
 * Shared authentication utilities
 * Reusable across HTTP requests and socket.io connections
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAuthCredentials = resolveAuthCredentials;
const logger_1 = __importDefault(require("../../logger"));
// Import promptfoo's cloud config for auth
let cloudConfig;
try {
    // Dynamic import to avoid circular dependencies
    const cloudModule = require('../../globalConfig/cloud');
    cloudConfig = cloudModule.cloudConfig;
}
catch (_error) {
    // Promptfoo auth not available - that's OK, will fall back to other methods
    // Silently fail since other auth methods are available
}
/**
 * Resolve authentication credentials using waterfall approach:
 * 1. API key from CLI argument or config file (passed as parameter)
 * 2. PROMPTFOO_API_KEY environment variable
 * 3. API key from promptfoo auth (cloudConfig)
 * 4. GitHub OIDC token (environment variable)
 *
 * @param apiKey Optional API key from CLI arg or config file
 * @returns Resolved auth credentials
 */
function resolveAuthCredentials(apiKey) {
    // 1. API key from argument (CLI --api-key or config file)
    if (apiKey) {
        logger_1.default.debug('Using API key from CLI/config');
        return { apiKey };
    }
    // 2. API key from environment variable
    const envApiKey = process.env.PROMPTFOO_API_KEY;
    if (envApiKey) {
        logger_1.default.debug('Using API key from PROMPTFOO_API_KEY env var');
        return {
            apiKey: envApiKey,
        };
    }
    // 3. API key from promptfoo auth
    if (cloudConfig) {
        const storedApiKey = cloudConfig.getApiKey();
        if (storedApiKey) {
            logger_1.default.debug('Using API key from promptfoo auth');
            return {
                apiKey: storedApiKey,
            };
        }
    }
    // 4. GitHub OIDC token
    const oidcToken = process.env.GITHUB_OIDC_TOKEN;
    if (oidcToken) {
        logger_1.default.debug('Using GitHub OIDC token');
        return {
            oidcToken,
        };
    }
    // No auth found
    return {};
}
//# sourceMappingURL=auth.js.map