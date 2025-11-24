"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
// Special test for METEOR assertion integration
describe('METEOR assertion', () => {
    beforeEach(() => {
        jest.resetModules();
    });
    afterEach(() => {
        jest.resetModules();
        jest.restoreAllMocks();
    });
    it('should use the handleMeteorAssertion when natural is available', async () => {
        // Setup a mock for the meteor module
        jest.mock('../../src/assertions/meteor', () => ({
            handleMeteorAssertion: jest.fn().mockResolvedValue({
                pass: true,
                score: 0.85,
                reason: 'METEOR test passed',
                assertion: { type: 'meteor' },
            }),
        }));
        // Import after mocking
        const { runAssertion } = await Promise.resolve().then(() => __importStar(require('../../src/assertions')));
        const result = await runAssertion({
            prompt: 'Test prompt',
            provider: {},
            assertion: {
                type: 'meteor',
                value: 'Expected output',
                threshold: 0.7,
            },
            test: {},
            providerResponse: { output: 'Actual output' },
        });
        // Verify the mock was called and the result is as expected
        const { handleMeteorAssertion } = await Promise.resolve().then(() => __importStar(require('../../src/assertions/meteor')));
        expect(handleMeteorAssertion).toHaveBeenCalledWith(expect.anything());
        expect(result.pass).toBe(true);
        expect(result.score).toBe(0.85);
        expect(result.reason).toBe('METEOR test passed');
    });
    it('should handle errors when natural package is missing', async () => {
        // Mock dynamic import to simulate the module not being found
        jest.mock('../../src/assertions/meteor', () => {
            throw new Error("Cannot find module 'natural'");
        });
        // Import after mocking
        const { runAssertion } = await Promise.resolve().then(() => __importStar(require('../../src/assertions')));
        const result = await runAssertion({
            prompt: 'Test prompt',
            provider: {},
            assertion: {
                type: 'meteor',
                value: 'Expected output',
                threshold: 0.7,
            },
            test: {},
            providerResponse: { output: 'Actual output' },
        });
        // Verify the error is handled correctly
        expect(result.pass).toBe(false);
        expect(result.score).toBe(0);
        expect(result.reason).toBe('METEOR assertion requires the natural package. Please install it using: npm install natural@^8.1.0');
        expect(result.assertion).toEqual({
            type: 'meteor',
            value: 'Expected output',
            threshold: 0.7,
        });
    });
    it('should rethrow other errors that are not related to missing module', async () => {
        // Mock dynamic import to simulate some other error
        jest.mock('../../src/assertions/meteor', () => {
            throw new Error('Some other error');
        });
        // Import after mocking
        const { runAssertion } = await Promise.resolve().then(() => __importStar(require('../../src/assertions')));
        // The error should be rethrown
        await expect(runAssertion({
            prompt: 'Test prompt',
            provider: {},
            assertion: {
                type: 'meteor',
                value: 'Expected output',
                threshold: 0.7,
            },
            test: {},
            providerResponse: { output: 'Actual output' },
        })).rejects.toThrow('Some other error');
    });
});
//# sourceMappingURL=meteorIntegration.test.js.map