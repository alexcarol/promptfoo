import type { ProviderOptions } from '../../types/providers';
interface ServerConfig {
    providers?: (string | ProviderOptions)[];
}
/**
 * Get the path to the UI providers config file
 * Checks in order:
 * 1. ${PROMPTFOO_CONFIG_DIR}/ui-providers.yaml
 * 2. ~/.promptfoo/ui-providers.yaml
 * @returns Path to config file or null if not found
 */
export declare function getServerConfigPath(): string | null;
/**
 * Load server configuration from file
 * Caches the result for performance
 * @returns Server configuration object
 */
export declare function loadServerConfig(): ServerConfig;
/**
 * Clear the cached config and reload from file
 * Useful for hot-reloading configuration
 * @returns Newly loaded server configuration
 */
export declare function reloadServerConfig(): ServerConfig;
/**
 * Get the list of available providers
 * Validates each provider against schema and filters out invalid ones
 * @returns Array of validated provider options
 */
export declare function getAvailableProviders(): ProviderOptions[];
export {};
//# sourceMappingURL=serverConfig.d.ts.map