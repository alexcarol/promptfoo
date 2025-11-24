"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const httpTransforms_1 = require("../../src/providers/httpTransforms");
describe('createTransformResponse', () => {
    it('should throw error if file:// reference is passed (should be pre-loaded)', async () => {
        await expect((0, httpTransforms_1.createTransformResponse)('file://custom-parser.js')).rejects.toThrow(/should be pre-loaded before calling createTransformResponse/);
    });
    it('should throw error for unsupported parser type', async () => {
        await expect((0, httpTransforms_1.createTransformResponse)(123)).rejects.toThrow("Unsupported response transform type: number. Expected a function, a string starting with 'file://' pointing to a JavaScript file, or a string containing a JavaScript expression.");
    });
    it('should return default parser when no parser is provided', async () => {
        const parser = await (0, httpTransforms_1.createTransformResponse)(undefined);
        const result = parser({ key: 'value' }, 'raw text');
        expect(result.output).toEqual({ key: 'value' });
    });
    it('should handle function parser returning an object', async () => {
        const parser = await (0, httpTransforms_1.createTransformResponse)((data) => ({
            output: data.result,
            metadata: { something: 1 },
            tokenUsage: { prompt: 2, completion: 3, total: 4 },
        }));
        const result = parser({ result: 'response text' }, '');
        expect(result).toEqual({
            output: 'response text',
            metadata: { something: 1 },
            tokenUsage: { prompt: 2, completion: 3, total: 4 },
        });
    });
    it('should handle function parser returning a primitive', async () => {
        const parser = await (0, httpTransforms_1.createTransformResponse)((data) => data.result);
        const result = parser({ result: 'success' }, '');
        expect(result).toEqual({ output: 'success' });
    });
    it('should handle string parser expression', async () => {
        const parser = await (0, httpTransforms_1.createTransformResponse)('json.result');
        const result = parser({ result: 'parsed' }, '');
        expect(result.output).toBe('parsed');
    });
    it('should handle arrow function expression', async () => {
        const parser = await (0, httpTransforms_1.createTransformResponse)('(json) => json.data');
        const result = parser({ data: 'value' }, '');
        expect(result.output).toBe('value');
    });
    it('should handle regular function expression', async () => {
        const parser = await (0, httpTransforms_1.createTransformResponse)('function(json) { return json.data; }');
        const result = parser({ data: 'value' }, '');
        expect(result.output).toBe('value');
    });
    it('should pass context parameter to parser', async () => {
        const parser = await (0, httpTransforms_1.createTransformResponse)('(json, text, context) => ({ output: json.data, status: context.response.status })');
        const result = parser({ data: 'value' }, '', { response: { status: 200 } });
        expect(result).toEqual({ output: 'value', status: 200 });
    });
    it('should handle errors in function parser gracefully', async () => {
        const errorFn = () => {
            throw new Error('Parser error');
        };
        const parser = await (0, httpTransforms_1.createTransformResponse)(errorFn);
        expect(() => parser({ data: 'test' }, 'test')).toThrow('Parser error');
    });
    it('should handle errors in string expression parser', async () => {
        const parser = await (0, httpTransforms_1.createTransformResponse)('json.nonexistent.field');
        expect(() => parser({}, '')).toThrow();
    });
    it('should return output with default data when no data provided', async () => {
        const parser = await (0, httpTransforms_1.createTransformResponse)(undefined);
        const result = parser(null, 'raw text');
        expect(result.output).toBe('raw text');
    });
});
describe('createTransformRequest', () => {
    it('should return identity function when no transform specified', async () => {
        const transform = await (0, httpTransforms_1.createTransformRequest)(undefined);
        const result = await transform('test prompt', {});
        expect(result).toBe('test prompt');
    });
    it('should handle string templates', async () => {
        const transform = await (0, httpTransforms_1.createTransformRequest)('return {"text": prompt}');
        const result = await transform('hello', {});
        expect(result).toEqual({
            text: 'hello',
        });
    });
    it('should handle errors in function-based transform', async () => {
        const errorFn = () => {
            throw new Error('Transform function error');
        };
        const transform = await (0, httpTransforms_1.createTransformRequest)(errorFn);
        await expect(async () => {
            await transform('test', {});
        }).rejects.toThrow('Error in request transform function: Transform function error');
    });
    it('should throw error if file:// reference is passed (should be pre-loaded)', async () => {
        await expect((0, httpTransforms_1.createTransformRequest)('file://error-transform.js')).rejects.toThrow(/should be pre-loaded before calling createTransformRequest/);
    });
    it('should handle errors in string template transform', async () => {
        const transform = await (0, httpTransforms_1.createTransformRequest)('return badVariable.nonexistent');
        await expect(async () => {
            await transform('test', {});
        }).rejects.toThrow('Failed to transform request:');
    });
    it('should throw error for unsupported transform type', async () => {
        await expect((0, httpTransforms_1.createTransformRequest)(123)).rejects.toThrow('Unsupported request transform type: number');
    });
    it('should handle errors in JavaScript expression transform', async () => {
        const transform = await (0, httpTransforms_1.createTransformRequest)('throw new Error("Expression error")');
        await expect(async () => {
            await transform('test', {});
        }).rejects.toThrow('Failed to transform request:');
    });
    it('should handle arrow function with explicit body', async () => {
        const transform = await (0, httpTransforms_1.createTransformRequest)('(prompt, vars) => { return { text: prompt.toUpperCase() } }');
        const result = await transform('hello', {});
        expect(result).toEqual({ text: 'HELLO' });
    });
    it('should handle arrow function with implicit return', async () => {
        const transform = await (0, httpTransforms_1.createTransformRequest)('(prompt) => prompt.toUpperCase()');
        const result = await transform('hello', {});
        expect(result).toBe('HELLO');
    });
    it('should handle regular function with explicit body', async () => {
        const transform = await (0, httpTransforms_1.createTransformRequest)('function(prompt, vars) { return { text: prompt.toUpperCase() } }');
        const result = await transform('hello', {});
        expect(result).toEqual({ text: 'HELLO' });
    });
    it('should handle simple expression without return', async () => {
        const transform = await (0, httpTransforms_1.createTransformRequest)('prompt.toUpperCase()');
        const result = await transform('hello', {});
        expect(result).toBe('HELLO');
    });
    it('should handle arrow function with context parameter', async () => {
        const transform = await (0, httpTransforms_1.createTransformRequest)('(prompt, vars, context) => ({ prompt, contextVars: context?.vars })');
        const result = await transform('hello', { foo: 'bar' }, { vars: { test: 'value' } });
        expect(result).toEqual({ prompt: 'hello', contextVars: { test: 'value' } });
    });
    it('should handle function-based transform', async () => {
        const transform = await (0, httpTransforms_1.createTransformRequest)((prompt) => ({
            transformed: prompt.toUpperCase(),
        }));
        const result = await transform('hello', {});
        expect(result).toEqual({ transformed: 'HELLO' });
    });
    it('should handle async function-based transform', async () => {
        const transform = await (0, httpTransforms_1.createTransformRequest)(async (prompt) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return { transformed: prompt.toUpperCase() };
        });
        const result = await transform('hello', {});
        expect(result).toEqual({ transformed: 'HELLO' });
    });
    it('should pass all parameters to function-based transform', async () => {
        const mockFn = jest.fn((prompt, vars, context) => ({ prompt, vars, context }));
        const transform = await (0, httpTransforms_1.createTransformRequest)(mockFn);
        const vars = { foo: 'bar' };
        const context = { test: 'value' };
        await transform('hello', vars, context);
        expect(mockFn).toHaveBeenCalledWith('hello', vars, context);
    });
    it('should handle string expression with vars parameter', async () => {
        const transform = await (0, httpTransforms_1.createTransformRequest)('({ text: prompt, extra: vars.extra })');
        const result = await transform('hello', { extra: 'data' });
        expect(result).toEqual({ text: 'hello', extra: 'data' });
    });
});
//# sourceMappingURL=httpTransforms.test.js.map