"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerConfigPath = getServerConfigPath;
exports.loadServerConfig = loadServerConfig;
exports.reloadServerConfig = reloadServerConfig;
exports.getAvailableProviders = getAvailableProviders;
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const js_yaml_1 = __importDefault(require("js-yaml"));
const envars_1 = require("../../envars");
const logger_1 = __importDefault(require("../../logger"));
const providers_1 = require("../../validators/providers");
let cachedConfig = null;
/**
 * Get the path to the UI providers config file
 * Checks in order:
 * 1. ${PROMPTFOO_CONFIG_DIR}/ui-providers.yaml
 * 2. ~/.promptfoo/ui-providers.yaml
 * @returns Path to config file or null if not found
 */
function getServerConfigPath() {
    // Get config directory (default to ~/.promptfoo)
    const configDir = (0, envars_1.getEnvString)('PROMPTFOO_CONFIG_DIR') || (0, path_1.join)((0, os_1.homedir)(), '.promptfoo');
    // Check for ui-providers.yaml
    const yamlPath = (0, path_1.join)(configDir, 'ui-providers.yaml');
    if ((0, fs_1.existsSync)(yamlPath)) {
        return yamlPath;
    }
    // Check for alternate .yml extension
    const ymlPath = (0, path_1.join)(configDir, 'ui-providers.yml');
    if ((0, fs_1.existsSync)(ymlPath)) {
        return ymlPath;
    }
    // No config file found
    return null;
}
/**
 * Load server configuration from file
 * Caches the result for performance
 * @returns Server configuration object
 */
function loadServerConfig() {
    if (cachedConfig) {
        return cachedConfig;
    }
    const configPath = getServerConfigPath();
    if (!configPath) {
        logger_1.default.debug('No server config file found, using defaults');
        cachedConfig = {};
        return cachedConfig;
    }
    try {
        const content = (0, fs_1.readFileSync)(configPath, 'utf8');
        const config = js_yaml_1.default.load(content);
        // Validate basic structure
        if (config && typeof config !== 'object') {
            logger_1.default.error('Invalid ui-providers.yaml: root must be an object, using defaults', {
                configPath,
                actualType: typeof config,
            });
            cachedConfig = {};
            return cachedConfig;
        }
        if (config?.providers && !Array.isArray(config.providers)) {
            logger_1.default.error('Invalid ui-providers.yaml: providers must be an array, using defaults', {
                configPath,
                actualType: typeof config.providers,
            });
            cachedConfig = {};
            return cachedConfig;
        }
        logger_1.default.info('Loaded server configuration', {
            configPath,
            providerCount: config?.providers?.length || 0,
        });
        cachedConfig = config || {};
        return cachedConfig;
    }
    catch (err) {
        // Differentiate error types for better debugging
        if (err instanceof js_yaml_1.default.YAMLException) {
            logger_1.default.error('Invalid YAML syntax in ui-providers.yaml, using defaults', {
                configPath,
                error: err,
                yamlError: err.message,
                line: err.mark?.line,
                column: err.mark?.column,
            });
        }
        else if (err.code === 'ENOENT') {
            // File not found - already logged in getServerConfigPath, this is unexpected
            logger_1.default.warn('Config file disappeared between check and read, using defaults', {
                configPath,
                error: err,
            });
        }
        else if (err.code === 'EACCES') {
            logger_1.default.error('Permission denied reading ui-providers.yaml, using defaults', {
                configPath,
                error: err,
            });
        }
        else {
            logger_1.default.error('Unexpected error loading ui-providers.yaml, using defaults', {
                configPath,
                error: err,
            });
        }
        cachedConfig = {};
        return cachedConfig;
    }
}
/**
 * Clear the cached config and reload from file
 * Useful for hot-reloading configuration
 * @returns Newly loaded server configuration
 */
function reloadServerConfig() {
    cachedConfig = null;
    return loadServerConfig();
}
/**
 * Get the list of available providers
 * Validates each provider against schema and filters out invalid ones
 * @returns Array of validated provider options
 */
function getAvailableProviders() {
    const config = loadServerConfig();
    if (!config.providers || config.providers.length === 0) {
        // No providers in config - will use defaults from frontend
        return [];
    }
    // Normalize and validate providers
    const validatedProviders = [];
    for (let i = 0; i < config.providers.length; i++) {
        const p = config.providers[i];
        const normalized = typeof p === 'string' ? { id: p } : p;
        // Validate against schema
        const result = providers_1.ProviderOptionsSchema.safeParse(normalized);
        if (!result.success) {
            logger_1.default.warn('Invalid provider configuration in ui-providers.yaml, skipping', {
                providerIndex: i,
                provider: normalized,
                validationErrors: result.error.errors,
            });
            continue;
        }
        // Ensure id is present (required for providers even though schema makes it optional)
        if (!result.data.id) {
            logger_1.default.warn('Provider missing required "id" field in ui-providers.yaml, skipping', {
                providerIndex: i,
                provider: normalized,
            });
            continue;
        }
        validatedProviders.push(result.data);
    }
    if (validatedProviders.length < config.providers.length) {
        logger_1.default.warn('Some providers were skipped due to validation errors', {
            totalProviders: config.providers.length,
            validProviders: validatedProviders.length,
            skippedCount: config.providers.length - validatedProviders.length,
        });
    }
    return validatedProviders;
}
//# sourceMappingURL=serverConfig.js.map