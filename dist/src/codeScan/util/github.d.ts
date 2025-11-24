/**
 * GitHub Utilities
 *
 * Helper functions for GitHub integration.
 */
import type { ParsedGitHubPR } from '../../types/codeScan';
/**
 * Parse GitHub PR string
 *
 * @param prString - GitHub PR string in format: owner/repo#number (e.g., promptfoo/promptfoo#123)
 * @returns Parsed PR object or null if invalid format
 */
export declare function parseGitHubPr(prString: string): ParsedGitHubPR | null;
//# sourceMappingURL=github.d.ts.map