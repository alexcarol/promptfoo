export declare enum BrowserBehavior {
    ASK = 0,
    OPEN = 1,
    SKIP = 2,
    OPEN_TO_REPORT = 3,
    OPEN_TO_REDTEAM_CREATE = 4
}
/**
 * Clears the feature detection cache - used for testing
 * @internal
 */
export declare function __clearFeatureCache(): void;
/**
 * Checks if a server supports a specific feature based on build date
 * @param featureName - Name of the feature (for caching and logging)
 * @param requiredBuildDate - Minimum build date when feature was added (ISO string)
 * @returns Promise<boolean> - true if server supports the feature
 */
export declare function checkServerFeatureSupport(featureName: string, requiredBuildDate: string): Promise<boolean>;
export declare function checkServerRunning(port?: number): Promise<boolean>;
export declare function openBrowser(browserBehavior: BrowserBehavior, port?: number): Promise<void>;
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
export declare function openAuthBrowser(authUrl: string, welcomeUrl: string, browserBehavior: BrowserBehavior): Promise<void>;
//# sourceMappingURL=server.d.ts.map