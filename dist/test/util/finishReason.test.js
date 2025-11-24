"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const finishReason_1 = require("../../src/util/finishReason");
(0, globals_1.describe)('normalizeFinishReason', () => {
    (0, globals_1.describe)('OpenAI mappings', () => {
        (0, globals_1.it)('should pass through OpenAI standard reasons unchanged', () => {
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('stop')).toBe('stop');
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('length')).toBe('length');
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('content_filter')).toBe('content_filter');
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('tool_calls')).toBe('tool_calls');
        });
        (0, globals_1.it)('should map function_call to tool_calls', () => {
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('function_call')).toBe('tool_calls');
        });
    });
    (0, globals_1.describe)('Anthropic mappings', () => {
        (0, globals_1.it)('should normalize Anthropic reasons to standard values', () => {
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('end_turn')).toBe('stop');
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('stop_sequence')).toBe('stop');
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('max_tokens')).toBe('length');
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('tool_use')).toBe('tool_calls');
        });
    });
    (0, globals_1.describe)('case normalization', () => {
        (0, globals_1.it)('should handle uppercase input', () => {
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('STOP')).toBe('stop');
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('LENGTH')).toBe('length');
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('END_TURN')).toBe('stop');
        });
        (0, globals_1.it)('should handle mixed case input', () => {
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('Stop')).toBe('stop');
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('Length')).toBe('length');
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('End_Turn')).toBe('stop');
        });
    });
    (0, globals_1.describe)('edge cases', () => {
        (0, globals_1.it)('should handle null and undefined', () => {
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)(null)).toBeUndefined();
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)(undefined)).toBeUndefined();
        });
        (0, globals_1.it)('should handle empty and whitespace strings', () => {
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('')).toBeUndefined();
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('   ')).toBeUndefined();
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('\t\n')).toBeUndefined();
        });
        (0, globals_1.it)('should handle non-string input', () => {
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)(123)).toBeUndefined();
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)({})).toBeUndefined();
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)([])).toBeUndefined();
        });
        (0, globals_1.it)('should trim whitespace', () => {
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('  stop  ')).toBe('stop');
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('\tlength\n')).toBe('length');
        });
    });
    (0, globals_1.describe)('unmapped reasons', () => {
        (0, globals_1.it)('should pass through unknown reasons unchanged', () => {
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('unknown_reason')).toBe('unknown_reason');
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('custom_stop')).toBe('custom_stop');
        });
        (0, globals_1.it)('should preserve case for unknown reasons after normalization', () => {
            (0, globals_1.expect)((0, finishReason_1.normalizeFinishReason)('CUSTOM_REASON')).toBe('custom_reason');
        });
    });
});
//# sourceMappingURL=finishReason.test.js.map