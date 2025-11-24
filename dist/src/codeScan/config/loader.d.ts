/**
 * Configuration Loader
 *
 * Loads and validates configuration from YAML files.
 */
import { type Config } from './schema';
/**
 * Load configuration from a YAML file
 * @param configPath Path to the configuration file
 * @returns Validated configuration object
 * @throws ConfigLoadError if file cannot be read or parsed
 */
export declare function loadConfig(configPath: string): Config;
/**
 * Load configuration with defaults
 * If no config path provided, returns default configuration
 * Returns a clone to prevent mutation of the singleton default
 */
export declare function loadConfigOrDefault(configPath?: string): Config;
/**
 * Options that can be passed to merge with config
 */
export interface ConfigMergeOptions {
    diffsOnly?: boolean;
    minSeverity?: string;
    minimumSeverity?: string;
    apiHost?: string;
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
export declare function mergeConfigWithOptions(config: Config, options: ConfigMergeOptions): Config;
/**
 * Options for resolving guidance
 */
export interface GuidanceOptions {
    guidance?: string;
    guidanceFile?: string;
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
export declare function resolveGuidance(options: GuidanceOptions, config: Config): string | undefined;
/**
 * Options for resolving API host
 */
export interface ApiHostOptions {
    apiHost?: string;
}
/**
 * Resolve API host from options or config
 *
 * @param options - Options that may contain API host
 * @param config - Configuration that may contain API host
 * @returns API host URL
 */
export declare function resolveApiHost(options: ApiHostOptions, config: Config): string;
//# sourceMappingURL=loader.d.ts.map