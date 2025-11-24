/**
 * Global state for Ruby executable path caching.
 * Ensures consistent Ruby executable usage across multiple provider instances.
 */
export declare const state: {
    /** The cached validated Ruby executable path */
    cachedRubyPath: string | null;
    /** Promise for in-progress validation to prevent duplicate validation attempts */
    validationPromise: Promise<string> | null;
    /** The Ruby path currently being validated to detect path changes */
    validatingPath: string | null;
};
/**
 * Attempts to get the Ruby executable path using platform-appropriate strategies.
 * @returns The Ruby executable path if successful, or null if failed.
 */
export declare function getSysExecutable(): Promise<string | null>;
/**
 * Attempts to validate a Ruby executable path.
 * @param path - The path to the Ruby executable to test.
 * @returns The validated path if successful, or null if invalid.
 */
export declare function tryPath(path: string): Promise<string | null>;
/**
 * Validates and caches the Ruby executable path.
 *
 * @param rubyPath - Path to the Ruby executable.
 * @param isExplicit - If true, only tries the provided path.
 * @returns Validated Ruby executable path.
 * @throws {Error} If no valid Ruby executable is found.
 */
export declare function validateRubyPath(rubyPath: string, isExplicit: boolean): Promise<string>;
/**
 * Runs a Ruby script with the specified method and arguments.
 *
 * @param scriptPath - The path to the Ruby script to run.
 * @param method - The name of the method to call in the Ruby script.
 * @param args - An array of arguments to pass to the Ruby script.
 * @param options - Optional settings for running the Ruby script.
 * @param options.rubyExecutable - Optional path to the Ruby executable.
 * @returns A promise that resolves to the output of the Ruby script.
 * @throws An error if there's an issue running the Ruby script or parsing its output.
 */
export declare function runRuby(scriptPath: string, method: string, args: (string | number | object | undefined)[], options?: {
    rubyExecutable?: string;
}): Promise<any>;
//# sourceMappingURL=rubyUtils.d.ts.map