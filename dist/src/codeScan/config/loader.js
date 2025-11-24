"use strict";
/**
 * Configuration Loader
 *
 * Loads and validates configuration from YAML files.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.loadConfigOrDefault = loadConfigOrDefault;
exports.mergeConfigWithOptions = mergeConfigWithOptions;
exports.resolveGuidance = resolveGuidance;
exports.resolveApiHost = resolveApiHost;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const schema_1 = require("./schema");
const codeScan_1 = require("../../types/codeScan");
/**
 * Load configuration from a YAML file
 * @param configPath Path to the configuration file
 * @returns Validated configuration object
 * @throws ConfigLoadError if file cannot be read or parsed
 */
function loadConfig(configPath) {
    // Check if file exists
    if (!fs_1.default.existsSync(configPath)) {
        throw new codeScan_1.ConfigLoadError(`Configuration file not found: ${configPath}`);
    }
    // Read file
    let fileContents;
    try {
        fileContents = fs_1.default.readFileSync(configPath, 'utf8');
    }
    catch (error) {
        throw new codeScan_1.ConfigLoadError(`Failed to read configuration file: ${error instanceof Error ? error.message : String(error)}`);
    }
    // Parse YAML
    let rawConfig;
    try {
        rawConfig = js_yaml_1.default.load(fileContents);
    }
    catch (error) {
        throw new codeScan_1.ConfigLoadError(`Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`);
    }
    // Validate against schema
    const result = schema_1.ConfigSchema.safeParse(rawConfig);
    if (!result.success) {
        const errors = result.error.errors
            .map((err) => `${err.path.join('.')}: ${err.message}`)
            .join(', ');
        throw new codeScan_1.ConfigLoadError(`Invalid configuration: ${errors}`);
    }
    const config = result.data;
    // If guidanceFile is specified, read it and populate guidance field
    if (config.guidanceFile) {
        const guidanceFilePath = path_1.default.isAbsolute(config.guidanceFile)
            ? config.guidanceFile
            : path_1.default.resolve(path_1.default.dirname(configPath), config.guidanceFile);
        try {
            config.guidance = fs_1.default.readFileSync(guidanceFilePath, 'utf-8');
        }
        catch (error) {
            throw new codeScan_1.ConfigLoadError(`Failed to read guidance file "${guidanceFilePath}": ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return config;
}
/**
 * Load configuration with defaults
 * If no config path provided, returns default configuration
 * Returns a clone to prevent mutation of the singleton default
 */
function loadConfigOrDefault(configPath) {
    if (!configPath) {
        return { ...schema_1.DEFAULT_CONFIG }; // Return clone to prevent singleton mutation
    }
    return loadConfig(configPath);
}
/**
 * Merge CLI options with configuration
 *
 * CLI options take precedence over config file settings
 *
 * @param config - Base configuration
 * @param options - CLI options to merge
 * @returns Merged configuration
 */
function mergeConfigWithOptions(config, options) {
    const merged = { ...config };
    // Allow options to override config file settings
    if (options.diffsOnly !== undefined) {
        merged.diffsOnly = options.diffsOnly;
    }
    // Allow CLI flags to override config severity (minSeverity takes precedence over minimumSeverity)
    if (options.minSeverity || options.minimumSeverity) {
        const cliSeverity = (options.minSeverity || options.minimumSeverity);
        // Validate severity input (throws ZodError if invalid)
        const { validateSeverity } = require('../../types/codeScan');
        merged.minimumSeverity = validateSeverity(cliSeverity);
    }
    // Override API host if provided
    if (options.apiHost) {
        merged.apiHost = options.apiHost;
    }
    return merged;
}
/**
 * Resolve guidance from options or config
 *
 * CLI options take precedence over config file settings
 *
 * @param options - Options that may contain guidance
 * @param config - Configuration that may contain guidance
 * @returns Guidance string or undefined
 * @throws Error if both guidance and guidanceFile are specified
 */
function resolveGuidance(options, config) {
    // Handle guidance options (mutually exclusive)
    if (options.guidance && options.guidanceFile) {
        throw new Error('Cannot specify both --guidance and --guidance-file options');
    }
    // CLI options take precedence over config
    if (options.guidance) {
        return options.guidance;
    }
    if (options.guidanceFile) {
        const absoluteGuidancePath = path_1.default.resolve(options.guidanceFile);
        try {
            return fs_1.default.readFileSync(absoluteGuidancePath, 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to read guidance file: ${absoluteGuidancePath} - ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // Config loader already read guidanceFile and populated guidance field
    return config.guidance;
}
/**
 * Resolve API host from options or config
 *
 * @param options - Options that may contain API host
 * @param config - Configuration that may contain API host
 * @returns API host URL
 */
function resolveApiHost(options, config) {
    return options.apiHost || config.apiHost || 'https://api.promptfoo.app';
}
//# sourceMappingURL=loader.js.map