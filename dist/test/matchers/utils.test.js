"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matchers_1 = require("../../src/matchers");
const defaults_1 = require("../../src/providers/openai/defaults");
describe('getGradingProvider', () => {
    it('should return the correct provider when provider is a string', async () => {
        const provider = await (0, matchers_1.getGradingProvider)('text', 'openai:chat:gpt-4o-mini-foobar', defaults_1.DefaultGradingProvider);
        // ok for this not to match exactly when the string is parsed
        expect(provider?.id()).toBe('openai:gpt-4o-mini-foobar');
    });
    it('should return the correct provider when provider is an ApiProvider', async () => {
        const provider = await (0, matchers_1.getGradingProvider)('embedding', defaults_1.DefaultEmbeddingProvider, defaults_1.DefaultGradingProvider);
        expect(provider).toBe(defaults_1.DefaultEmbeddingProvider);
    });
    it('should return the correct provider when provider is ProviderOptions', async () => {
        const providerOptions = {
            id: 'openai:chat:gpt-4o-mini-foobar',
            config: {
                apiKey: 'abc123',
                temperature: 3.1415926,
            },
        };
        const provider = await (0, matchers_1.getGradingProvider)('text', providerOptions, defaults_1.DefaultGradingProvider);
        expect(provider?.id()).toBe('openai:chat:gpt-4o-mini-foobar');
    });
    it('should return the default provider when provider is not provided', async () => {
        const provider = await (0, matchers_1.getGradingProvider)('text', undefined, defaults_1.DefaultGradingProvider);
        expect(provider).toBe(defaults_1.DefaultGradingProvider);
    });
});
describe('getAndCheckProvider', () => {
    it('should return the default provider when provider is not defined', async () => {
        await expect((0, matchers_1.getAndCheckProvider)('text', undefined, defaults_1.DefaultGradingProvider, 'test check')).resolves.toBe(defaults_1.DefaultGradingProvider);
    });
    it('should return the default provider when provider does not support type', async () => {
        const provider = {
            id: () => 'test-provider',
            callApi: () => Promise.resolve({ output: 'test' }),
        };
        await expect((0, matchers_1.getAndCheckProvider)('embedding', provider, defaults_1.DefaultEmbeddingProvider, 'test check')).resolves.toBe(defaults_1.DefaultEmbeddingProvider);
    });
    it('should return the provider if it implements the required method', async () => {
        const provider = {
            id: () => 'test-provider',
            callApi: () => Promise.resolve({ output: 'test' }),
            callEmbeddingApi: () => Promise.resolve({ embedding: [] }),
        };
        const result = await (0, matchers_1.getAndCheckProvider)('embedding', provider, defaults_1.DefaultEmbeddingProvider, 'test check');
        expect(result).toBe(provider);
    });
    it('should return the default provider when no provider is specified', async () => {
        const provider = await (0, matchers_1.getGradingProvider)('text', undefined, defaults_1.DefaultGradingProvider);
        expect(provider).toBe(defaults_1.DefaultGradingProvider);
    });
    it('should return a specific provider when a provider id is specified', async () => {
        const provider = await (0, matchers_1.getGradingProvider)('text', 'openai:chat:foo', defaults_1.DefaultGradingProvider);
        // loadApiProvider removes `chat` from the id
        expect(provider?.id()).toBe('openai:foo');
    });
    it('should return a provider from ApiProvider when specified', async () => {
        const providerOptions = {
            id: () => 'custom-provider',
            callApi: async () => ({}),
        };
        const provider = await (0, matchers_1.getGradingProvider)('text', providerOptions, defaults_1.DefaultGradingProvider);
        expect(provider?.id()).toBe('custom-provider');
    });
    it('should return a provider from ProviderTypeMap when specified', async () => {
        const providerTypeMap = {
            text: {
                id: 'openai:chat:foo',
            },
            embedding: {
                id: 'openai:embedding:bar',
            },
        };
        const provider = await (0, matchers_1.getGradingProvider)('text', providerTypeMap, defaults_1.DefaultGradingProvider);
        expect(provider?.id()).toBe('openai:chat:foo');
    });
    it('should return a provider from ProviderTypeMap with basic strings', async () => {
        const providerTypeMap = {
            text: 'openai:chat:foo',
            embedding: 'openai:embedding:bar',
        };
        const provider = await (0, matchers_1.getGradingProvider)('text', providerTypeMap, defaults_1.DefaultGradingProvider);
        expect(provider?.id()).toBe('openai:foo');
    });
    it('should throw an error when the provider does not match the type', async () => {
        const providerTypeMap = {
            embedding: {
                id: 'openai:embedding:foo',
            },
        };
        await expect((0, matchers_1.getGradingProvider)('text', providerTypeMap, defaults_1.DefaultGradingProvider)).rejects.toThrow(new Error(`Invalid provider definition for output type 'text': ${JSON.stringify(providerTypeMap, null, 2)}`));
    });
});
describe('tryParse and renderLlmRubricPrompt', () => {
    let tryParse;
    beforeAll(async () => {
        const context = { capturedFn: null };
        await (0, matchers_1.renderLlmRubricPrompt)('{"test":"value"}', {
            __capture(fn) {
                context.capturedFn = fn;
                return 'captured';
            },
        });
        tryParse = function (content) {
            try {
                if (content === null || content === undefined) {
                    return content;
                }
                return JSON.parse(content);
            }
            catch { }
            return content;
        };
    });
    it('should parse valid JSON', () => {
        const input = '{"key": "value"}';
        expect(tryParse(input)).toEqual({ key: 'value' });
    });
    it('should return original string for invalid JSON', () => {
        const input = 'not json';
        expect(tryParse(input)).toBe('not json');
    });
    it('should handle empty string', () => {
        const input = '';
        expect(tryParse(input)).toBe('');
    });
    it('should handle null and undefined', () => {
        expect(tryParse(null)).toBeNull();
        expect(tryParse(undefined)).toBeUndefined();
    });
    it('should render strings inside JSON objects', async () => {
        const template = '{"role": "user", "content": "Hello {{name}}"}';
        const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { name: 'World' });
        const parsed = JSON.parse(result);
        expect(parsed).toEqual({ role: 'user', content: 'Hello World' });
    });
    it('should preserve JSON structure while rendering only strings', async () => {
        const template = '{"nested": {"text": "{{var}}", "number": 42}}';
        const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { var: 'test' });
        const parsed = JSON.parse(result);
        expect(parsed).toEqual({ nested: { text: 'test', number: 42 } });
    });
    it('should handle non-JSON templates with legacy rendering', async () => {
        const template = 'Hello {{name}}';
        const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { name: 'World' });
        expect(result).toBe('Hello World');
    });
    it('should handle complex objects in context', async () => {
        const template = '{"text": "{{object}}"}';
        const complexObject = { foo: 'bar', baz: [1, 2, 3] };
        const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { object: complexObject });
        const parsed = JSON.parse(result);
        expect(typeof parsed.text).toBe('string');
        // With our fix, this should now be stringified JSON instead of [object Object]
        expect(parsed.text).toBe(JSON.stringify(complexObject));
    });
    it('should properly stringify objects', async () => {
        const template = 'Source Text:\n{{input}}';
        // Create objects that would typically cause the [object Object] issue
        const objects = [
            { name: 'Object 1', properties: { color: 'red', size: 'large' } },
            { name: 'Object 2', properties: { color: 'blue', size: 'small' } },
        ];
        const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { input: objects });
        // With our fix, this should properly stringify the objects
        expect(result).not.toContain('[object Object]');
        expect(result).toContain(JSON.stringify(objects[0]));
        expect(result).toContain(JSON.stringify(objects[1]));
    });
    it('should handle mixed arrays of objects and primitives', async () => {
        const template = 'Items: {{items}}';
        const mixedArray = ['string item', { name: 'Object item' }, 42, [1, 2, 3]];
        const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { items: mixedArray });
        // Objects in array should be stringified
        expect(result).not.toContain('[object Object]');
        expect(result).toContain('string item');
        expect(result).toContain(JSON.stringify({ name: 'Object item' }));
        expect(result).toContain('42');
        expect(result).toContain(JSON.stringify([1, 2, 3]));
    });
    it('should render arrays of objects correctly', async () => {
        const template = '{"items": [{"name": "{{name1}}"}, {"name": "{{name2}}"}]}';
        const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { name1: 'Alice', name2: 'Bob' });
        const parsed = JSON.parse(result);
        expect(parsed).toEqual({
            items: [{ name: 'Alice' }, { name: 'Bob' }],
        });
    });
    it('should handle multiline strings', async () => {
        const template = `{"content": "Line 1\\nLine {{number}}\\nLine 3"}`;
        const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { number: '2' });
        const parsed = JSON.parse(result);
        expect(parsed).toEqual({
            content: 'Line 1\nLine 2\nLine 3',
        });
    });
    it('should handle nested templates', async () => {
        const template = '{"outer": "{{value1}}", "inner": {"value": "{{value2}}"}}';
        const result = await (0, matchers_1.renderLlmRubricPrompt)(template, {
            value1: 'outer value',
            value2: 'inner value',
        });
        const parsed = JSON.parse(result);
        expect(parsed).toEqual({
            outer: 'outer value',
            inner: { value: 'inner value' },
        });
    });
    it('should handle escaping in JSON strings', async () => {
        const template = '{"content": "This needs \\"escaping\\" and {{var}} too"}';
        const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { var: 'var with "quotes"' });
        const parsed = JSON.parse(result);
        expect(parsed.content).toBe('This needs "escaping" and var with "quotes" too');
    });
    it('should work with nested arrays and objects', async () => {
        const template = JSON.stringify({
            role: 'system',
            content: 'Process this: {{input}}',
            config: {
                options: [
                    { id: 1, label: '{{option1}}' },
                    { id: 2, label: '{{option2}}' },
                ],
            },
        });
        const evalResult = await (0, matchers_1.renderLlmRubricPrompt)(template, {
            input: 'test input',
            option1: 'First Option',
            option2: 'Second Option',
        });
        const parsed = JSON.parse(evalResult);
        expect(parsed.content).toBe('Process this: test input');
        expect(parsed.config.options[0].label).toBe('First Option');
        expect(parsed.config.options[1].label).toBe('Second Option');
    });
    it('should handle rendering statements with join filter', async () => {
        const statements = ['Statement 1', 'Statement 2', 'Statement 3'];
        const template = 'statements:\n{{statements|join("\\n")}}';
        const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { statements });
        const expected = 'statements:\nStatement 1\nStatement 2\nStatement 3';
        expect(result).toBe(expected);
    });
    it('should stringify objects in arrays', async () => {
        const template = 'Items: {{items}}';
        const items = [{ name: 'Item 1', price: 10 }, 'string item', { name: 'Item 2', price: 20 }];
        const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { items });
        expect(result).not.toContain('[object Object]');
        expect(result).toContain(JSON.stringify(items[0]));
        expect(result).toContain('string item');
        expect(result).toContain(JSON.stringify(items[2]));
    });
    it('should stringify deeply nested objects and arrays', async () => {
        const template = 'Complex data: {{data}}';
        const data = {
            products: [
                {
                    name: 'Item 1',
                    price: 10,
                    details: {
                        color: 'red',
                        specs: { weight: '2kg', dimensions: { width: 10, height: 20 } },
                    },
                },
                'string item',
                {
                    name: 'Item 2',
                    price: 20,
                    nested: [{ a: 1 }, { b: 2 }],
                    metadata: { tags: ['electronics', 'gadget'] },
                },
            ],
        };
        const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { data });
        expect(result).not.toContain('[object Object]');
        expect(result).toContain('"specs":{"weight":"2kg"');
        expect(result).toContain('"dimensions":{"width":10,"height":20}');
        expect(result).toContain('[{"a":1},{"b":2}]');
        expect(result).toContain('"tags":["electronics","gadget"]');
        expect(result).toContain('string item');
    });
});
describe('PROMPTFOO_DISABLE_OBJECT_STRINGIFY environment variable', () => {
    afterEach(() => {
        // Clean up environment variable after each test
        delete process.env.PROMPTFOO_DISABLE_OBJECT_STRINGIFY;
    });
    describe('Default behavior (PROMPTFOO_DISABLE_OBJECT_STRINGIFY=false)', () => {
        beforeEach(() => {
            process.env.PROMPTFOO_DISABLE_OBJECT_STRINGIFY = 'false';
        });
        it('should stringify objects to prevent [object Object] issues', async () => {
            const template = 'Product: {{product}}';
            const product = { name: 'Headphones', price: 99.99 };
            const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { product });
            expect(result).not.toContain('[object Object]');
            expect(result).toBe(`Product: ${JSON.stringify(product)}`);
        });
        it('should stringify objects in arrays', async () => {
            const template = 'Items: {{items}}';
            const items = [{ name: 'Item 1', price: 10 }, 'string item', { name: 'Item 2', price: 20 }];
            const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { items });
            expect(result).not.toContain('[object Object]');
            expect(result).toContain(JSON.stringify(items[0]));
            expect(result).toContain('string item');
            expect(result).toContain(JSON.stringify(items[2]));
        });
    });
    describe('Object access enabled (PROMPTFOO_DISABLE_OBJECT_STRINGIFY=true)', () => {
        beforeEach(() => {
            process.env.PROMPTFOO_DISABLE_OBJECT_STRINGIFY = 'true';
        });
        it('should allow direct object property access', async () => {
            const template = 'Product: {{product.name}} - ${{product.price}}';
            const product = { name: 'Headphones', price: 99.99 };
            const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { product });
            expect(result).toBe('Product: Headphones - $99.99');
        });
        it('should allow array indexing and property access', async () => {
            const template = 'First item: {{items[0].name}}';
            const items = [
                { name: 'First Item', price: 10 },
                { name: 'Second Item', price: 20 },
            ];
            const result = await (0, matchers_1.renderLlmRubricPrompt)(template, { items });
            expect(result).toBe('First item: First Item');
        });
    });
});
//# sourceMappingURL=utils.test.js.map