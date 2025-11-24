/**
 * Gets the remote generation API endpoint URL.
 * Prioritizes: env var > cloud config > default endpoint.
 * @returns The remote generation URL
 */
export declare function getRemoteGenerationUrl(): string;
/**
 * Check if remote generation should never be used.
 * Respects both the general and redteam-specific disable flags.
 * @returns true if remote generation is disabled
 */
export declare function neverGenerateRemote(): boolean;
/**
 * Check if remote generation should never be used for non-redteam features.
 * This allows granular control: disable redteam remote generation while allowing
 * regular SimulatedUser to use remote generation.
 * @returns true if ALL remote generation is disabled
 */
export declare function neverGenerateRemoteForRegularEvals(): boolean;
/**
 * Builds a remote URL with a substituted pathname, honoring env vars / cloud config.
 */
export declare function buildRemoteUrl(pathname: string, fallback: string): string | null;
/**
 * Gets the URL for checking remote API health based on configuration.
 * @returns The health check URL, or null if remote generation is disabled.
 */
export declare function getRemoteHealthUrl(): string | null;
/**
 * Gets the URL for checking remote API version based on configuration.
 * @returns The version check URL, or null if remote generation is disabled.
 */
export declare function getRemoteVersionUrl(): string | null;
/**
 * Determines if remote generation should be used based on configuration.
 * @returns true if remote generation should be used
 */
export declare function shouldGenerateRemote(): boolean;
/**
 * Gets the URL for unaligned model inference (harmful content generation).
 * Prioritizes: env var > cloud config > default endpoint.
 * @returns The unaligned inference URL
 */
export declare function getRemoteGenerationUrlForUnaligned(): string;
//# sourceMappingURL=remoteGeneration.d.ts.map