"use strict";
/**
 * GitHub Utilities
 *
 * Helper functions for GitHub integration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGitHubPr = parseGitHubPr;
/**
 * Parse GitHub PR string
 *
 * @param prString - GitHub PR string in format: owner/repo#number (e.g., promptfoo/promptfoo#123)
 * @returns Parsed PR object or null if invalid format
 */
function parseGitHubPr(prString) {
    const match = prString.match(/^([^/]+)\/([^#]+)#(\d+)$/);
    if (!match) {
        return null;
    }
    const [, owner, repo, prNumber] = match;
    return {
        owner,
        repo,
        number: parseInt(prNumber, 10),
    };
}
//# sourceMappingURL=github.js.map