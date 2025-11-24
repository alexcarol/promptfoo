"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const finishReason_1 = require("../../src/assertions/finishReason");
(0, globals_1.describe)('finishReason assertion', () => {
    (0, globals_1.it)('should pass when finish reason matches', () => {
        const params = {
            assertion: { type: 'finish-reason', value: 'stop' },
            providerResponse: { finishReason: 'stop' },
        };
        const result = (0, finishReason_1.handleFinishReason)(params);
        (0, globals_1.expect)(result.pass).toBe(true);
        (0, globals_1.expect)(result.score).toBe(1);
    });
    (0, globals_1.it)('should fail when stop reason does not match', () => {
        const params = {
            assertion: { type: 'finish-reason', value: 'stop' },
            providerResponse: { finishReason: 'length' },
        };
        const result = (0, finishReason_1.handleFinishReason)(params);
        (0, globals_1.expect)(result.pass).toBe(false);
        (0, globals_1.expect)(result.score).toBe(0);
    });
    (0, globals_1.it)('should fail when provider does not return stop reason', () => {
        const params = {
            assertion: { type: 'finish-reason', value: 'stop' },
            providerResponse: {},
        };
        const result = (0, finishReason_1.handleFinishReason)(params);
        (0, globals_1.expect)(result.pass).toBe(false);
        (0, globals_1.expect)(result.score).toBe(0);
        (0, globals_1.expect)(result.reason).toContain('did not supply');
    });
    (0, globals_1.it)('should handle renderedValue override', () => {
        const params = {
            assertion: { type: 'finish-reason', value: 'stop' },
            renderedValue: 'length',
            providerResponse: { finishReason: 'length' },
        };
        const result = (0, finishReason_1.handleFinishReason)(params);
        (0, globals_1.expect)(result.pass).toBe(true);
        (0, globals_1.expect)(result.score).toBe(1);
    });
    (0, globals_1.it)('should prioritize renderedValue over assertion.value', () => {
        const params = {
            assertion: { type: 'finish-reason', value: 'stop' },
            renderedValue: 'length',
            providerResponse: { finishReason: 'stop' },
        };
        const result = (0, finishReason_1.handleFinishReason)(params);
        (0, globals_1.expect)(result.pass).toBe(false);
        (0, globals_1.expect)(result.score).toBe(0);
        (0, globals_1.expect)(result.reason).toContain('Expected finish reason "length" but got "stop"');
    });
    (0, globals_1.it)('should throw for non-string assertion value', () => {
        const params = {
            assertion: { type: 'finish-reason', value: 123 },
            providerResponse: { finishReason: 'stop' },
        };
        (0, globals_1.expect)(() => (0, finishReason_1.handleFinishReason)(params)).toThrow('"finish-reason" assertion type must have a string value');
    });
    (0, globals_1.it)('should throw for non-string renderedValue', () => {
        const params = {
            assertion: { type: 'finish-reason', value: 'stop' },
            renderedValue: 123,
            providerResponse: { finishReason: 'stop' },
        };
        (0, globals_1.expect)(() => (0, finishReason_1.handleFinishReason)(params)).toThrow('"finish-reason" assertion type must have a string value');
    });
    (0, globals_1.it)('should handle undefined finishReason gracefully', () => {
        const params = {
            assertion: { type: 'finish-reason', value: 'stop' },
            providerResponse: { finishReason: undefined },
        };
        const result = (0, finishReason_1.handleFinishReason)(params);
        (0, globals_1.expect)(result.pass).toBe(false);
        (0, globals_1.expect)(result.score).toBe(0);
        (0, globals_1.expect)(result.reason).toContain('did not supply');
    });
    (0, globals_1.it)('should perform case-insensitive matching', () => {
        const params = {
            assertion: { type: 'finish-reason', value: 'stop' },
            providerResponse: { finishReason: 'STOP' }, // Different case
        };
        const result = (0, finishReason_1.handleFinishReason)(params);
        (0, globals_1.expect)(result.pass).toBe(true); // Now passes with case-insensitive comparison
        (0, globals_1.expect)(result.score).toBe(1);
        (0, globals_1.expect)(result.reason).toBe('Assertion passed');
    });
    (0, globals_1.it)('should handle mixed case in both assertion and response', () => {
        const params = {
            assertion: { type: 'finish-reason', value: 'LENGTH' },
            providerResponse: { finishReason: 'length' },
        };
        const result = (0, finishReason_1.handleFinishReason)(params);
        (0, globals_1.expect)(result.pass).toBe(true);
        (0, globals_1.expect)(result.score).toBe(1);
    });
});
//# sourceMappingURL=finishReason.test.js.map