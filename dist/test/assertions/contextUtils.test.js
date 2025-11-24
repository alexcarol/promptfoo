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
Object.defineProperty(exports, "__esModule", { value: true });
const contextUtils_1 = require("../../src/assertions/contextUtils");
const transformUtil = __importStar(require("../../src/util/transform"));
jest.mock('../../src/util/transform');
describe('resolveContext', () => {
    const mockTransform = jest.mocked(transformUtil.transform);
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('with context variable', () => {
        it('should return context from test.vars.context', async () => {
            const assertion = { type: 'context-faithfulness' };
            const test = {
                vars: { context: 'test context' },
                options: {},
            };
            const result = await (0, contextUtils_1.resolveContext)(assertion, test, 'output', 'prompt');
            expect(result).toBe('test context');
            expect(mockTransform).not.toHaveBeenCalled();
        });
        it('should return context array from test.vars.context', async () => {
            const assertion = { type: 'context-faithfulness' };
            const contextArray = ['chunk 1', 'chunk 2', 'chunk 3'];
            const test = {
                vars: { context: contextArray },
                options: {},
            };
            const result = await (0, contextUtils_1.resolveContext)(assertion, test, 'output', 'prompt');
            expect(result).toEqual(contextArray);
            expect(mockTransform).not.toHaveBeenCalled();
        });
        it('should reject context array with non-string elements', async () => {
            const assertion = { type: 'context-faithfulness' };
            const test = {
                vars: { context: ['valid', 123, 'invalid'] },
                options: {},
            };
            await expect((0, contextUtils_1.resolveContext)(assertion, test, 'output', 'prompt')).rejects.toThrow('Invalid context: expected an array of strings, but found number at index 1');
        });
        it('should use fallback context when no context variable', async () => {
            const assertion = { type: 'context-recall' };
            const test = { vars: {}, options: {} };
            const result = await (0, contextUtils_1.resolveContext)(assertion, test, 'output', 'prompt', 'fallback context');
            expect(result).toBe('fallback context');
            expect(mockTransform).not.toHaveBeenCalled();
        });
    });
    describe('with contextTransform', () => {
        it('should transform output to get context', async () => {
            mockTransform.mockResolvedValue('transformed context');
            const assertion = {
                type: 'context-faithfulness',
                contextTransform: 'output.context',
            };
            const test = { vars: {}, options: {} };
            const result = await (0, contextUtils_1.resolveContext)(assertion, test, { context: 'data' }, 'prompt');
            expect(result).toBe('transformed context');
            expect(mockTransform).toHaveBeenCalledWith('output.context', { context: 'data' }, {
                vars: {},
                prompt: { label: 'prompt' },
            });
        });
        it('should transform output to get context array', async () => {
            const mockArray = ['chunk 1', 'chunk 2', 'chunk 3'];
            mockTransform.mockResolvedValue(mockArray);
            const assertion = {
                type: 'context-faithfulness',
                contextTransform: 'output.chunks',
            };
            const test = { vars: {}, options: {} };
            const result = await (0, contextUtils_1.resolveContext)(assertion, test, { chunks: ['a', 'b', 'c'] }, 'prompt');
            expect(result).toEqual(mockArray);
            expect(mockTransform).toHaveBeenCalledWith('output.chunks', { chunks: ['a', 'b', 'c'] }, {
                vars: {},
                prompt: { label: 'prompt' },
            });
        });
        it('should prioritize contextTransform over context variable', async () => {
            mockTransform.mockResolvedValue('transformed context');
            const assertion = {
                type: 'context-faithfulness',
                contextTransform: 'output.context',
            };
            const test = {
                vars: { context: 'original context' },
                options: {},
            };
            const result = await (0, contextUtils_1.resolveContext)(assertion, test, { context: 'data' }, 'prompt');
            expect(result).toBe('transformed context');
            expect(mockTransform).toHaveBeenCalledWith('output.context', { context: 'data' }, {
                vars: { context: 'original context' },
                prompt: { label: 'prompt' },
            });
        });
        it('should throw error if transform returns non-string and non-string-array', async () => {
            mockTransform.mockResolvedValue(123);
            const assertion = {
                type: 'context-faithfulness',
                contextTransform: 'output.invalid',
            };
            const test = { vars: {}, options: {} };
            await expect((0, contextUtils_1.resolveContext)(assertion, test, 'output', 'prompt')).rejects.toThrow('contextTransform must return a string or array of strings. Got number. Check your transform expression: output.invalid');
        });
        it('should throw error if transform returns array with non-string elements', async () => {
            mockTransform.mockResolvedValue(['valid', 123, 'invalid']);
            const assertion = {
                type: 'context-faithfulness',
                contextTransform: 'output.invalid',
            };
            const test = { vars: {}, options: {} };
            await expect((0, contextUtils_1.resolveContext)(assertion, test, 'output', 'prompt')).rejects.toThrow('contextTransform must return a string or array of strings. Got object. Check your transform expression: output.invalid');
        });
        it('should throw error if transform fails', async () => {
            mockTransform.mockRejectedValue(new Error('Transform failed'));
            const assertion = {
                type: 'context-faithfulness',
                contextTransform: 'output.invalid',
            };
            const test = { vars: {}, options: {} };
            await expect((0, contextUtils_1.resolveContext)(assertion, test, 'output', 'prompt')).rejects.toThrow("Failed to transform context using expression 'output.invalid': Transform failed");
        });
    });
    describe('error cases', () => {
        it('should throw error when no context is available', async () => {
            const assertion = { type: 'context-faithfulness' };
            const test = { vars: {}, options: {} };
            await expect((0, contextUtils_1.resolveContext)(assertion, test, 'output', 'prompt')).rejects.toThrow('Context is required for context-based assertions. Provide either a "context" variable (string or array of strings) in your test case or use "contextTransform" to extract context from the provider response.');
        });
        it('should throw error when context is empty string', async () => {
            const assertion = { type: 'context-faithfulness' };
            const test = {
                vars: { context: '' },
                options: {},
            };
            await expect((0, contextUtils_1.resolveContext)(assertion, test, 'output', 'prompt')).rejects.toThrow('Context is required for context-based assertions. Provide either a "context" variable (string or array of strings) in your test case or use "contextTransform" to extract context from the provider response.');
        });
        it('should throw error when context is empty array', async () => {
            const assertion = { type: 'context-faithfulness' };
            const test = {
                vars: { context: [] },
                options: {},
            };
            await expect((0, contextUtils_1.resolveContext)(assertion, test, 'output', 'prompt')).rejects.toThrow('Context is required for context-based assertions. Provide either a "context" variable (string or array of strings) in your test case or use "contextTransform" to extract context from the provider response.');
        });
        it('should throw error when context array contains empty strings', async () => {
            const assertion = { type: 'context-faithfulness' };
            const test = {
                vars: { context: ['valid chunk', '', 'another chunk'] },
                options: {},
            };
            await expect((0, contextUtils_1.resolveContext)(assertion, test, 'output', 'prompt')).rejects.toThrow('Context is required for context-based assertions. Provide either a "context" variable (string or array of strings) in your test case or use "contextTransform" to extract context from the provider response.');
        });
        it('should throw error when contextTransform returns empty string', async () => {
            mockTransform.mockResolvedValue('');
            const assertion = {
                type: 'context-faithfulness',
                contextTransform: 'output.empty',
            };
            const test = { vars: {}, options: {} };
            await expect((0, contextUtils_1.resolveContext)(assertion, test, 'output', 'prompt')).rejects.toThrow('Context is required for context-based assertions. Provide either a "context" variable (string or array of strings) in your test case or use "contextTransform" to extract context from the provider response.');
        });
        it('should throw error when contextTransform returns empty array', async () => {
            mockTransform.mockResolvedValue([]);
            const assertion = {
                type: 'context-faithfulness',
                contextTransform: 'output.empty',
            };
            const test = { vars: {}, options: {} };
            await expect((0, contextUtils_1.resolveContext)(assertion, test, 'output', 'prompt')).rejects.toThrow('Context is required for context-based assertions. Provide either a "context" variable (string or array of strings) in your test case or use "contextTransform" to extract context from the provider response.');
        });
    });
});
//# sourceMappingURL=contextUtils.test.js.map