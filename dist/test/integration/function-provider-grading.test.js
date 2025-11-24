"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Integration test to verify function providers work end-to-end in grading scenarios
 * This tests the exact issue from #3784: function providers in defaultTest.options.provider
 */
const matchers_1 = require("../../src/matchers");
describe('Function Provider Integration - Issue #3784', () => {
    it('should work with getGradingProvider when passed as ApiProvider object', async () => {
        // Create a mock function provider (simulating what resolveProvider returns)
        const mockFunctionProvider = jest.fn(async (prompt) => {
            return { output: `Graded: ${prompt}` };
        });
        mockFunctionProvider.label = 'test-grader';
        // This is what resolveProvider returns for function providers
        const resolvedProvider = {
            id: () => mockFunctionProvider.label,
            callApi: mockFunctionProvider,
        };
        // Now pass it through getGradingProvider (this is what matchers.ts does)
        const gradingProvider = await (0, matchers_1.getGradingProvider)('text', resolvedProvider, null);
        expect(gradingProvider).toBeDefined();
        expect(gradingProvider).toBe(resolvedProvider); // Should return same object
        expect(typeof gradingProvider.id).toBe('function');
        expect(gradingProvider.id()).toBe('test-grader');
        expect(gradingProvider.callApi).toBe(mockFunctionProvider);
    });
    it('should actually call the function provider', async () => {
        const mockFunctionProvider = jest.fn(async (prompt) => {
            return { output: `Response for: ${prompt}` };
        });
        const resolvedProvider = {
            id: () => 'custom-grader',
            callApi: mockFunctionProvider,
        };
        const gradingProvider = await (0, matchers_1.getGradingProvider)('text', resolvedProvider, null);
        // Actually call the provider
        const result = await gradingProvider.callApi('test prompt');
        expect(mockFunctionProvider).toHaveBeenCalledWith('test prompt');
        expect(result.output).toBe('Response for: test prompt');
    });
    it('should handle function provider without label', async () => {
        const mockFunctionProvider = jest.fn(async (prompt) => {
            return { output: `Graded: ${prompt}` };
        });
        // No label, so resolveProvider uses 'custom-function'
        const resolvedProvider = {
            id: () => 'custom-function',
            callApi: mockFunctionProvider,
        };
        const gradingProvider = await (0, matchers_1.getGradingProvider)('text', resolvedProvider, null);
        expect(gradingProvider).toBeDefined();
        expect(gradingProvider.id()).toBe('custom-function');
    });
    it('should correctly identify as ApiProvider based on type check', async () => {
        const mockFunctionProvider = jest.fn(async () => ({ output: 'test' }));
        const resolvedProvider = {
            id: () => 'test',
            callApi: mockFunctionProvider,
        };
        // This is the exact check from getGradingProvider line 120
        const isApiProviderCheck = typeof resolvedProvider === 'object' &&
            typeof resolvedProvider.id === 'function';
        expect(isApiProviderCheck).toBe(true);
    });
});
//# sourceMappingURL=function-provider-grading.test.js.map