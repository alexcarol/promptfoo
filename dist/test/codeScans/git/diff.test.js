"use strict";
/**
 * Git Diff Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const diff_1 = require("../../../src/codeScan/git/diff");
const codeScan_1 = require("../../../src/types/codeScan");
// Mock simple-git
jest.mock('simple-git');
describe('Git Diff', () => {
    let mockGit;
    beforeEach(() => {
        jest.clearAllMocks();
        // Create a mock SimpleGit instance
        mockGit = {
            status: jest.fn(),
            branch: jest.fn(),
            diff: jest.fn(),
            log: jest.fn(),
        };
        // Mock the default import
        const simpleGit = require('simple-git');
        simpleGit.default = jest.fn(() => mockGit);
    });
    describe('validateOnBranch', () => {
        it('should return current branch name when on a branch', async () => {
            mockGit.status.mockResolvedValue({
                current: 'feature/test-branch',
                detached: false,
            });
            const branchName = await (0, diff_1.validateOnBranch)(mockGit);
            expect(branchName).toBe('feature/test-branch');
        });
        it('should throw GitError when in detached HEAD state', async () => {
            mockGit.status.mockResolvedValue({
                current: null,
                detached: true,
            });
            await expect((0, diff_1.validateOnBranch)(mockGit)).rejects.toThrow(codeScan_1.GitError);
            await expect((0, diff_1.validateOnBranch)(mockGit)).rejects.toThrow('Not on a branch');
        });
    });
    describe('extractDiff', () => {
        it('should extract diff comparing against main branch', async () => {
            const mockDiff = `diff --git a/file.ts b/file.ts
index 123..456 100644
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,4 @@
+const newLine = 'test';
 const existingLine = 'existing';`;
            // Mock status (for validateOnBranch)
            mockGit.status.mockResolvedValue({
                current: 'feature/test',
                detached: false,
            });
            // Mock main branch exists
            mockGit.branch.mockResolvedValue({
                all: ['main', 'feature/test'],
                branches: {},
                current: 'feature/test',
                detached: false,
            });
            mockGit.diff.mockResolvedValue(mockDiff);
            const result = await (0, diff_1.extractDiff)('/fake/repo');
            expect(result).toEqual({
                diff: mockDiff,
                baseBranch: 'main',
            });
            expect(mockGit.diff).toHaveBeenCalledWith(['main...HEAD']);
        });
        it('should fall back to master branch if main does not exist', async () => {
            const mockDiff = 'diff content';
            // Mock status (for validateOnBranch)
            mockGit.status.mockResolvedValue({
                current: 'feature/test',
                detached: false,
            });
            // Mock main branch does not exist, master does
            mockGit.branch.mockResolvedValue({
                all: ['master', 'feature/test'],
                branches: {},
                current: 'feature/test',
                detached: false,
            });
            mockGit.diff.mockResolvedValue(mockDiff);
            const result = await (0, diff_1.extractDiff)('/fake/repo');
            expect(result).toEqual({
                diff: mockDiff,
                baseBranch: 'master',
            });
            expect(mockGit.diff).toHaveBeenCalledWith(['master...HEAD']);
        });
        it('should throw GitError when neither main nor master exists', async () => {
            // Mock status (for validateOnBranch)
            mockGit.status.mockResolvedValue({
                current: 'feature/test',
                detached: false,
            });
            // Mock neither branch exists - should throw error
            mockGit.branch.mockResolvedValue({
                all: ['feature/test'],
                branches: {},
                current: 'feature/test',
                detached: false,
            });
            await expect((0, diff_1.extractDiff)('/fake/repo')).rejects.toThrow(codeScan_1.GitError);
        });
        it('should throw GitError if no changes detected', async () => {
            // Mock status (for validateOnBranch)
            mockGit.status.mockResolvedValue({
                current: 'feature/test',
                detached: false,
            });
            mockGit.branch.mockResolvedValue({
                all: ['main', 'feature/test'],
                branches: {},
                current: 'feature/test',
                detached: false,
            });
            // Mock empty diff
            mockGit.diff.mockResolvedValue('');
            await expect((0, diff_1.extractDiff)('/fake/repo')).rejects.toThrow(codeScan_1.GitError);
            await expect((0, diff_1.extractDiff)('/fake/repo')).rejects.toThrow('No changes detected');
        });
        it('should throw GitError if diff extraction fails', async () => {
            // Mock status (for validateOnBranch)
            mockGit.status.mockResolvedValue({
                current: 'feature/test',
                detached: false,
            });
            mockGit.branch.mockResolvedValue({
                all: ['main', 'feature/test'],
                branches: {},
                current: 'feature/test',
                detached: false,
            });
            mockGit.diff.mockRejectedValue(new Error('git diff failed'));
            await expect((0, diff_1.extractDiff)('/fake/repo')).rejects.toThrow(codeScan_1.GitError);
            await expect((0, diff_1.extractDiff)('/fake/repo')).rejects.toThrow('Failed to extract diff');
        });
    });
});
//# sourceMappingURL=diff.test.js.map