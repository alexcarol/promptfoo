"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../src/assertions/index");
describe('select-best context propagation', () => {
    it('should pass context with originalProvider to grading provider', async () => {
        let capturedContext;
        // Create a grading provider that captures the context
        const gradingProvider = {
            id: () => 'test-grading-provider',
            callApi: jest.fn(async (_prompt, context) => {
                capturedContext = context;
                return {
                    output: '0', // Select first option
                    tokenUsage: {},
                };
            }),
        };
        const originalProvider = {
            id: () => 'original-provider',
            callApi: jest.fn(),
        };
        const test = {
            vars: { foo: 'bar' },
            options: {
                provider: gradingProvider,
            },
        };
        const assertion = {
            type: 'select-best',
            value: 'Pick the best output',
        };
        const outputs = ['Output 1', 'Output 2'];
        const contextToPass = {
            originalProvider,
            prompt: { raw: 'test prompt', label: 'test' },
            vars: { foo: 'bar' },
        };
        // Call runCompareAssertion with context
        await (0, index_1.runCompareAssertion)(test, assertion, outputs, contextToPass);
        // Verify the grading provider was called
        expect(gradingProvider.callApi).toHaveBeenCalled();
        // Verify it received the context with originalProvider
        expect(capturedContext).toBeDefined();
        expect(capturedContext?.originalProvider).toBeDefined();
        expect(capturedContext?.originalProvider?.id()).toBe('original-provider');
    });
});
//# sourceMappingURL=select-best-minimal.integration.test.js.map