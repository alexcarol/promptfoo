/**
 * Utilities for detecting CLI installation method and generating appropriate next commands.
 * Combines multiple detection strategies for robust installer identification.
 */
/**
 * Supported installer types that affect command generation.
 */
export type InstallerType = 'npx' | 'brew' | 'npm-global' | 'unknown';
/**
 * Detects how the CLI was invoked by checking various environment variables and paths.
 * Uses a combination of the original isRunningUnderNpx logic and new detection methods.
 *
 * @returns The detected installer type
 */
export declare function detectInstaller(): InstallerType;
/**
 * Builds the appropriate promptfoo command based on how the CLI was installed.
 * Automatically adds the correct prefix (npx, etc.) for the user's environment.
 *
 * @param subcommand - The subcommand to run (e.g., 'eval', 'redteam init', or '' for just the base command)
 * @returns The complete promptfoo command string ready to run
 *
 * @example
 * ```typescript
 * // For npx users: "npx promptfoo@latest eval"
 * // For others: "promptfoo eval"
 * const cmd = promptfooCommand('eval');
 *
 * // For npx users: "npx promptfoo@latest"
 * // For others: "promptfoo"
 * const baseCmd = promptfooCommand('');
 *
 * // Complex subcommands work too
 * const redteamCmd = promptfooCommand('redteam init --plugins harmful');
 * ```
 */
export declare function promptfooCommand(subcommand: string): string;
/**
 * Legacy function for backwards compatibility.
 * @deprecated Use detectInstaller() instead
 */
export declare function isRunningUnderNpx(): boolean;
//# sourceMappingURL=promptfooCommand.d.ts.map