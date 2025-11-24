"use strict";
/**
 * Git Metadata Extraction
 *
 * Extracts metadata about the current branch and commits.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMetadata = extractMetadata;
const simple_git_1 = __importDefault(require("simple-git"));
const codeScan_1 = require("../../types/codeScan");
/**
 * Extract git metadata for the comparison
 * @param repoPath Path to the git repository
 * @param baseBranch Base branch or commit
 * @param compareRef Compare branch or commit
 * @returns Git metadata object
 */
async function extractMetadata(repoPath, baseBranch, compareRef) {
    const git = (0, simple_git_1.default)(repoPath);
    try {
        // Store original refs
        const baseRef = baseBranch;
        const compareRefValue = compareRef;
        // Resolve to exact SHAs
        const baseSha = (await git.revparse([baseBranch])).trim();
        const compareSha = (await git.revparse([compareRef])).trim();
        // Get commits between base and compare ref
        const log = await git.log({
            from: baseBranch,
            to: compareRef,
        });
        // Extract commit messages
        const commitMessages = log.all.map((commit) => {
            return `${commit.hash.substring(0, 7)}: ${commit.message}`;
        });
        // Get author from most recent commit
        const author = log.latest?.author_name || 'Unknown';
        // Get timestamp from most recent commit
        const timestamp = log.latest?.date || new Date().toISOString();
        return {
            branch: compareRef,
            baseBranch,
            baseRef,
            baseSha,
            compareRef: compareRefValue,
            compareSha,
            commitMessages,
            author,
            timestamp,
        };
    }
    catch (error) {
        throw new codeScan_1.GitMetadataError(`Failed to extract git metadata: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=metadata.js.map