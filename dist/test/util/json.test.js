"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const index_1 = require("../../src/types/index");
const json_1 = require("../../src/util/json");
describe('json utilities', () => {
    describe('getAjv', () => {
        beforeAll(() => {
            process.env.NODE_ENV = 'test';
        });
        beforeEach(() => {
            delete process.env.PROMPTFOO_DISABLE_AJV_STRICT_MODE;
            (0, json_1.resetAjv)();
        });
        afterEach(() => {
            delete process.env.PROMPTFOO_DISABLE_AJV_STRICT_MODE;
        });
        it('should create an Ajv instance with default options', () => {
            const ajv = (0, json_1.getAjv)();
            expect(ajv).toBeDefined();
            expect(ajv.opts.strictSchema).toBe(true);
        });
        it('should disable strict mode when PROMPTFOO_DISABLE_AJV_STRICT_MODE is set', () => {
            process.env.PROMPTFOO_DISABLE_AJV_STRICT_MODE = 'true';
            const ajv = (0, json_1.getAjv)();
            expect(ajv.opts.strictSchema).toBe(false);
        });
        it('should add formats to the Ajv instance', () => {
            const ajv = (0, json_1.getAjv)();
            expect(ajv.formats).toBeDefined();
            expect(Object.keys(ajv.formats)).not.toHaveLength(0);
        });
        it('should reuse the same instance on subsequent calls', () => {
            const firstInstance = (0, json_1.getAjv)();
            const secondInstance = (0, json_1.getAjv)();
            expect(firstInstance).toBe(secondInstance);
        });
        it('should reset the instance when resetAjv is called', () => {
            const firstInstance = (0, json_1.getAjv)();
            (0, json_1.resetAjv)();
            const secondInstance = (0, json_1.getAjv)();
            expect(firstInstance).not.toBe(secondInstance);
        });
        it('should only allow resetAjv to be called in test environment', () => {
            const originalNodeEnv = process.env.NODE_ENV;
            try {
                process.env.NODE_ENV = 'production';
                expect(() => (0, json_1.resetAjv)()).toThrow('resetAjv can only be called in test environment');
            }
            finally {
                process.env.NODE_ENV = originalNodeEnv;
            }
        });
    });
    describe('isValidJson', () => {
        it('returns true for valid JSON', () => {
            expect((0, json_1.isValidJson)('{"key": "value"}')).toBe(true);
            expect((0, json_1.isValidJson)('[1, 2, 3]')).toBe(true);
            expect((0, json_1.isValidJson)('"string"')).toBe(true);
            expect((0, json_1.isValidJson)('123')).toBe(true);
            expect((0, json_1.isValidJson)('true')).toBe(true);
            expect((0, json_1.isValidJson)('null')).toBe(true);
        });
        it('returns false for invalid JSON', () => {
            expect((0, json_1.isValidJson)('{')).toBe(false);
            expect((0, json_1.isValidJson)('["unclosed array"')).toBe(false);
            expect((0, json_1.isValidJson)('{"key": value}')).toBe(false);
            expect((0, json_1.isValidJson)('undefined')).toBe(false);
        });
    });
    describe('safeJsonStringify', () => {
        it('stringifies simple objects', () => {
            const obj = { key: 'value', number: 123 };
            expect((0, json_1.safeJsonStringify)(obj)).toBe('{"key":"value","number":123}');
        });
        it('handles circular references', () => {
            const obj = { key: 'value' };
            obj.circular = obj;
            expect((0, json_1.safeJsonStringify)(obj)).toBe('{"key":"value"}');
        });
        it('pretty prints when specified', () => {
            const obj = {
                key: 'value',
                nested: { inner: 'content' },
            };
            const expected = (0, dedent_1.default) `
      {
        "key": "value",
        "nested": {
          "inner": "content"
        }
      }`;
            expect((0, json_1.safeJsonStringify)(obj, true)).toBe(expected);
        });
        it('handles null values', () => {
            expect((0, json_1.safeJsonStringify)(null)).toBe('null');
        });
        it('handles undefined values', () => {
            expect((0, json_1.safeJsonStringify)(undefined)).toBeUndefined();
        });
        it('returns undefined or strips non-serializable values', () => {
            expect((0, json_1.safeJsonStringify)(() => { })).toBeUndefined(); // Function
            expect((0, json_1.safeJsonStringify)(Symbol('sym'))).toBeUndefined(); // Symbol
            expect((0, json_1.safeJsonStringify)({ key: 'value' })).toBe('{"key":"value"}');
        });
        it('returns undefined for circular references in arrays', () => {
            const arr = [1, 2, 3];
            arr.push(arr);
            expect((0, json_1.safeJsonStringify)(arr)).toBe('[1,2,3,null]');
        });
        it('handles complex nested structures', () => {
            const complex = {
                string: 'value',
                number: 123,
                boolean: true,
                null: null,
                array: [1, 'two', { three: 3 }],
                nested: {
                    a: 1,
                    b: [2, 3],
                },
            };
            const result = (0, json_1.safeJsonStringify)(complex);
            expect(result).toBeDefined(); // Ensure it returns a string
            expect(JSON.parse(result)).toEqual(complex); // Ensure it matches the original structure
        });
        it('handles arrays with circular references', () => {
            const arr = [1, 2, 3];
            arr.push(arr);
            expect((0, json_1.safeJsonStringify)(arr)).toBe('[1,2,3,null]');
        });
        it('handles nested circular references', () => {
            const obj = { a: { b: {} } };
            obj.a.b.c = obj.a;
            expect((0, json_1.safeJsonStringify)(obj)).toBe('{"a":{"b":{}}}');
        });
        it('preserves non-circular nested structures', () => {
            const nested = { a: { b: { c: 1 } }, d: [1, 2, { e: 3 }] };
            expect(JSON.parse((0, json_1.safeJsonStringify)(nested))).toEqual(nested);
        });
    });
    describe('extractJsonObjects', () => {
        it('should extract a single JSON object from a string', () => {
            const input = '{"key": "value"}';
            const expectedOutput = [{ key: 'value' }];
            expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
        });
        it('should extract multiple JSON objects from a string', () => {
            const input = 'yolo {"key1": "value1"} some text {"key2": "value2"} fomo';
            const expectedOutput = [{ key1: 'value1' }, { key2: 'value2' }];
            expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
        });
        it('should return an empty array if no JSON objects are found', () => {
            const input = 'no json here';
            const expectedOutput = [];
            expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
        });
        it('should handle nested JSON objects', () => {
            const input = 'wassup {"outer": {"inner": "value"}, "foo": [1,2,3,4]}';
            const expectedOutput = [{ outer: { inner: 'value' }, foo: [1, 2, 3, 4] }];
            expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
        });
        it('should handle comments', () => {
            const input = `{
        "reason": "all good",
        "score": 1.0 // perfect score
      }`;
            const expectedOutput = [{ reason: 'all good', score: 1.0 }];
            expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
        });
        it('should handle jsonl', () => {
            const input = `{"reason": "hello", "score": 1.0}
      {"reason": "world", "score": 0.0}`;
            const expectedOutput = [
                { reason: 'hello', score: 1.0 },
                { reason: 'world', score: 0.0 },
            ];
            expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
        });
        it('should handle invalid JSON gracefully', () => {
            const input = '{"key": "value" some text {"key2": "value2"}';
            const expectedOutput = [{ key2: 'value2' }];
            expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
        });
        it('should handle incomplete JSON', () => {
            const input = `{
  "incomplete": "object"`;
            expect((0, json_1.extractJsonObjects)(input)).toEqual([
                {
                    incomplete: 'object',
                },
            ]);
        });
        it('should handle string containing incomplete JSON', () => {
            const input = (0, dedent_1.default) `{
        "key1": "value1",
        "key2": {
          "nested": "value2"
        },
        "key3": "value3"
      }
      {
        "incomplete": "object"`;
            expect((0, json_1.extractJsonObjects)(input)).toEqual([
                {
                    key1: 'value1',
                    key2: {
                        nested: 'value2',
                    },
                    key3: 'value3',
                },
                {
                    incomplete: 'object',
                },
            ]);
        });
        it('should handle this case', () => {
            const obj = {
                vars: [
                    {
                        language: 'Klingon',
                        body: 'Live long and prosper',
                    },
                    {
                        language: 'Elvish',
                        body: 'Good morning',
                    },
                    {
                        language: 'Esperanto',
                        body: 'I love learning languages',
                    },
                    {
                        language: 'Morse Code',
                        body: 'Help',
                    },
                    {
                        language: 'Emoji',
                        body: 'I am feeling happy 😊',
                    },
                    {
                        language: 'Binary',
                        body: 'Yes',
                    },
                    {
                        language: 'Javascript',
                        body: 'Hello, World!',
                    },
                    {
                        language: 'Shakespearean',
                        body: 'To be or not to be',
                    },
                    {
                        language: 'Leet Speak',
                        body: 'You are amazing',
                    },
                    {
                        language: 'Old English',
                        body: 'What is thy name?',
                    },
                    {
                        language: 'Yoda Speak',
                        body: 'Strong with the force, you are',
                    },
                ],
            };
            const input = JSON.stringify(obj);
            expect((0, json_1.extractJsonObjects)(input)).toEqual([obj]);
        });
        it('should handle YAML-style unquoted strings', () => {
            const input = '{key: value, another_key: another value}';
            const expectedOutput = [{ key: 'value', another_key: 'another value' }];
            expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
        });
        describe('convertSlashCommentsToHash', () => {
            it('should convert basic // comments to # comments', () => {
                const input = 'some text // this is a comment';
                const expected = 'some text # this is a comment';
                expect((0, json_1.convertSlashCommentsToHash)(input)).toBe(expected);
            });
            it('should not convert // inside double quoted strings', () => {
                const input = '"this // is not a comment" // but this is';
                const expected = '"this // is not a comment" # but this is';
                expect((0, json_1.convertSlashCommentsToHash)(input)).toBe(expected);
            });
            it('should not convert // inside single quoted strings', () => {
                const input = "'don't convert // here' // convert here";
                const expected = "'don't convert // here' # convert here";
                expect((0, json_1.convertSlashCommentsToHash)(input)).toBe(expected);
            });
            it('should handle escaped quotes in strings', () => {
                const input = '"escaped \\" quote // not a comment" // real comment';
                const expected = '"escaped \\" quote // not a comment" # real comment';
                expect((0, json_1.convertSlashCommentsToHash)(input)).toBe(expected);
            });
            it('should handle multiple comments in one line', () => {
                const input = 'text // first comment // not a second comment';
                const expected = 'text # first comment // not a second comment';
                expect((0, json_1.convertSlashCommentsToHash)(input)).toBe(expected);
            });
            it('should handle comments at the start of the line', () => {
                const input = '// comment at start\ntext // comment at end';
                const expected = '# comment at start\ntext # comment at end';
                expect((0, json_1.convertSlashCommentsToHash)(input)).toBe(expected);
            });
            it('should handle strings with multiple lines', () => {
                const input = (0, dedent_1.default) `
          line1 // comment 1
          "string with // not a comment"
          line3 // comment 2`;
                const expected = (0, dedent_1.default) `
          line1 # comment 1
          "string with // not a comment"
          line3 # comment 2`;
                expect((0, json_1.convertSlashCommentsToHash)(input)).toBe(expected);
            });
            it('should handle nested quotes', () => {
                const input = '"outer \\"inner // not comment\\" still outer" // real comment';
                const expected = '"outer \\"inner // not comment\\" still outer" # real comment';
                expect((0, json_1.convertSlashCommentsToHash)(input)).toBe(expected);
            });
            it('should handle mixed single and double quotes', () => {
                const input = '"contains \'nested\' // not comment" // real comment';
                const expected = '"contains \'nested\' // not comment" # real comment';
                expect((0, json_1.convertSlashCommentsToHash)(input)).toBe(expected);
            });
            it('should handle empty strings', () => {
                expect((0, json_1.convertSlashCommentsToHash)('')).toBe('');
            });
            it('should handle strings without comments', () => {
                const input = 'no comments here';
                expect((0, json_1.convertSlashCommentsToHash)(input)).toBe(input);
            });
            it('should handle strings with only a comment', () => {
                const input = '// just a comment';
                const expected = '# just a comment';
                expect((0, json_1.convertSlashCommentsToHash)(input)).toBe(expected);
            });
            it('should handle multiple sequential comment markers', () => {
                const input = 'text //// double comment';
                const expected = 'text ## double comment';
                expect((0, json_1.convertSlashCommentsToHash)(input)).toBe(expected);
            });
            it('should handle JSON-like structures', () => {
                const input = '{\n  "key": "value", // comment here\n  "key2": "value2" // another comment\n}';
                const expected = '{\n  "key": "value", # comment here\n  "key2": "value2" # another comment\n}';
                expect((0, json_1.convertSlashCommentsToHash)(input)).toBe(expected);
            });
            it('should handle comments after different types of values', () => {
                const inputs = [
                    'null // after null',
                    'true // after boolean',
                    '42 // after number',
                    '"string" // after string',
                    '[] // after array',
                    '{} // after object',
                ];
                const expected = inputs.map((input) => input.replace('//', '#'));
                inputs.forEach((input, i) => {
                    expect((0, json_1.convertSlashCommentsToHash)(input)).toBe(expected[i]);
                });
            });
        });
        it('should skip non-object YAML values', () => {
            const input = 'plain string {key: value} 42 {another: obj} true';
            const expectedOutput = [{ key: 'value' }, { another: 'obj' }];
            expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
        });
        it('should handle YAML with mixed quoted and unquoted strings', () => {
            const input = '{unquoted: value, "quoted": "value", another: "mixed"}';
            const expectedOutput = [{ unquoted: 'value', quoted: 'value', another: 'mixed' }];
            expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
        });
        it('should ignore YAML arrays and scalars', () => {
            const input = '[1, 2, 3] {obj: value} plain: string {another: obj}';
            const expectedOutput = [{ obj: 'value' }, { another: 'obj' }];
            expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
        });
        it('should handle YAML with special characters', () => {
            const input = '{key: value with spaces, special: value!@#$%, empty:}';
            const expectedOutput = [{ key: 'value with spaces', special: 'value!@#$%', empty: null }];
            expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
        });
        describe('LLM output scenarios', () => {
            it('should handle JSON with inline comments', () => {
                const input = (0, dedent_1.default) `
          {
            "reason": "The test passed",
            "score": 1.0 # The score is perfect because all criteria were met
          }`;
                const expectedOutput = [
                    {
                        reason: 'The test passed',
                        score: 1.0,
                    },
                ];
                expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
            });
            it('should handle JSON with multiline string containing markdown', () => {
                const input = (0, dedent_1.default) `
          {
            "reason": "The summary provided is mostly accurate but contains some omissions:

            - Point 1: Details here
            - Point 2: More details

            Some additional context...",
            "score": 0.75
          }`;
                const expectedOutput = [
                    {
                        reason: 'The summary provided is mostly accurate but contains some omissions:\n- Point 1: Details here - Point 2: More details\nSome additional context...',
                        score: 0.75,
                    },
                ];
                expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
            });
            it('should handle JSON with unescaped backticks', () => {
                const input = (0, dedent_1.default) `
          {
            "reason": "\`\`The summary accurately reflects...",
            "score": 1.0
          }`;
                const expectedOutput = [
                    {
                        reason: '``The summary accurately reflects...',
                        score: 1.0,
                    },
                ];
                expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
            });
            it('should handle JSON with trailing commas', () => {
                const input = (0, dedent_1.default) `
          {
            "key1": "value1",
            "key2": "value2",
          }`;
                const expectedOutput = [
                    {
                        key1: 'value1',
                        key2: 'value2',
                    },
                ];
                expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
            });
            it('should handle multiple JSON objects in LLM output with text in between', () => {
                const input = (0, dedent_1.default) `
          Here's my analysis:
          {
            "first_point": "valid observation",
            "score": 0.8
          }

          And another point:
          {
            "second_point": "another observation",
            "score": 0.9
          }`;
                const expectedOutput = [
                    {
                        first_point: 'valid observation',
                        score: 0.8,
                    },
                    {
                        second_point: 'another observation',
                        score: 0.9,
                    },
                ];
                expect((0, json_1.extractJsonObjects)(input)).toEqual(expectedOutput);
            });
        });
    });
    describe('orderKeys', () => {
        it('orders keys according to specified order', () => {
            const obj = { c: 3, a: 1, b: 2 };
            const order = ['a', 'b', 'c'];
            const result = (0, json_1.orderKeys)(obj, order);
            expect(Object.keys(result)).toEqual(['a', 'b', 'c']);
        });
        it('places unspecified keys at the end', () => {
            const obj = { d: 4, b: 2, a: 1, c: 3 };
            const order = ['a', 'b'];
            const result = (0, json_1.orderKeys)(obj, order);
            expect(Object.keys(result)).toEqual(['a', 'b', 'd', 'c']);
        });
        it('ignores specified keys that do not exist in the object', () => {
            const obj = { a: 1, c: 3 };
            const order = ['a', 'b', 'c', 'd'];
            const result = (0, json_1.orderKeys)(obj, order);
            expect(Object.keys(result)).toEqual(['a', 'c']);
        });
        it('returns an empty object when input is empty', () => {
            const obj = {};
            const order = ['a', 'b', 'c'];
            const result = (0, json_1.orderKeys)(obj, order);
            expect(result).toEqual({});
        });
        it('returns the original object when order is empty', () => {
            const obj = { c: 3, a: 1, b: 2 };
            const order = [];
            const result = (0, json_1.orderKeys)(obj, order);
            expect(result).toEqual(obj);
        });
        it('preserves nested object structures', () => {
            const obj = { c: { x: 1 }, a: [1, 2], b: 2 };
            const order = ['a', 'b', 'c'];
            const result = (0, json_1.orderKeys)(obj, order);
            expect(result).toEqual({ a: [1, 2], b: 2, c: { x: 1 } });
        });
        it('handles objects with symbol keys', () => {
            const sym1 = Symbol('sym1');
            const sym2 = Symbol('sym2');
            const obj = { [sym1]: 1, b: 2, [sym2]: 3, a: 4 };
            const order = ['a', 'b'];
            const result = (0, json_1.orderKeys)(obj, order);
            expect(Object.getOwnPropertySymbols(result)).toEqual([sym1, sym2]);
            expect(Object.keys(result)).toEqual(['a', 'b']);
        });
        it('maintains the correct types for keys and values', () => {
            const obj = { a: 'string', b: 42, c: true, d: null, e: undefined };
            const order = ['b', 'a', 'c', 'd', 'e'];
            const result = (0, json_1.orderKeys)(obj, order);
            expect(result).toEqual({ b: 42, a: 'string', c: true, d: null, e: undefined });
        });
    });
    describe('extractFirstJsonObject', () => {
        it('should extract the first JSON object from a string', () => {
            const input = '{"key1": "value1"} {"key2": "value2"}';
            const expected = { key1: 'value1' };
            expect((0, json_1.extractFirstJsonObject)(input)).toEqual(expected);
        });
        it('should throw an error when no JSON objects are found', () => {
            const input = 'no json here';
            expect(() => (0, json_1.extractFirstJsonObject)(input)).toThrow('Expected a JSON object, but got "no json here"');
        });
    });
    describe('summarizeEvaluateResultForLogging', () => {
        // Create test EvaluateResult with reasonable data size
        const createTestEvaluateResult = () => {
            return {
                id: 'test-eval-result',
                testIdx: 0,
                promptIdx: 0,
                success: false,
                score: 0.5,
                error: 'Test error',
                failureReason: index_1.ResultFailureReason.ERROR,
                latencyMs: 100,
                promptId: 'test-prompt-id',
                provider: {
                    id: 'test-provider',
                    label: 'Test Provider',
                },
                response: {
                    output: 'This is a test output that is reasonably sized for testing purposes.',
                    error: undefined,
                    cached: false,
                    cost: 0.01,
                    tokenUsage: {
                        total: 1000,
                        prompt: 500,
                        completion: 500,
                    },
                    metadata: {
                        model: 'gpt-4',
                        timestamp: '2024-01-01T00:00:00Z',
                        additionalData: 'Some additional metadata for testing',
                    },
                },
                testCase: {
                    description: 'Test case with regular data',
                    vars: {
                        input: 'test input',
                        context: 'test context',
                    },
                },
                prompt: {
                    raw: 'Test prompt',
                    display: 'Test Prompt Display',
                    label: 'Test Prompt Label',
                },
                vars: {
                    userInput: 'test user input',
                    systemPrompt: 'test system prompt',
                },
                namedScores: {},
            };
        };
        it('should throw TypeError for null or undefined input', () => {
            expect(() => (0, json_1.summarizeEvaluateResultForLogging)(null)).toThrow(TypeError);
            expect(() => (0, json_1.summarizeEvaluateResultForLogging)(undefined)).toThrow(TypeError);
        });
        it('should create a safe summary of evaluation results', () => {
            const testResult = createTestEvaluateResult();
            const summary = (0, json_1.summarizeEvaluateResultForLogging)(testResult);
            expect(summary.id).toBe('test-eval-result');
            expect(summary.testIdx).toBe(0);
            expect(summary.promptIdx).toBe(0);
            expect(summary.success).toBe(false);
            expect(summary.score).toBe(0.5);
            expect(summary.error).toBe('Test error');
            expect(summary.failureReason).toBe(index_1.ResultFailureReason.ERROR);
            expect(summary.provider?.id).toBe('test-provider');
            expect(summary.provider?.label).toBe('Test Provider');
            expect(summary.response?.output).toBeDefined();
            expect(summary.response?.cached).toBe(false);
            expect(summary.response?.cost).toBe(0.01);
            expect(summary.response?.tokenUsage).toEqual({
                total: 1000,
                prompt: 500,
                completion: 500,
            });
            expect(summary.response?.metadata?.keys).toContain('model');
            expect(summary.response?.metadata?.keys).toContain('timestamp');
            expect(summary.response?.metadata?.keys).toContain('additionalData');
            expect(summary.response?.metadata?.keyCount).toBe(3);
            expect(summary.testCase?.description).toBe('Test case with regular data');
            expect(summary.testCase?.vars).toEqual(['input', 'context']);
        });
        it('should handle custom options', () => {
            const testResult = createTestEvaluateResult();
            const summary = (0, json_1.summarizeEvaluateResultForLogging)(testResult, 20, false);
            expect(summary.response?.output?.length).toBeLessThanOrEqual(35); // 20 + '...[truncated]'
            expect(summary.response?.metadata).toBeUndefined();
        });
        it('should handle EvaluateResult with minimal data', () => {
            const minimalResult = {
                id: 'minimal-result',
                testIdx: 1,
                promptIdx: 2,
                success: true,
                score: 1.0,
                failureReason: index_1.ResultFailureReason.NONE,
                latencyMs: 50,
                promptId: 'minimal-prompt-id',
                provider: { id: 'minimal-provider' },
                prompt: {
                    raw: 'test prompt',
                    label: 'Test Prompt',
                },
                vars: {},
                testCase: { vars: {} },
                namedScores: {},
            };
            const summary = (0, json_1.summarizeEvaluateResultForLogging)(minimalResult);
            expect(summary.id).toBe('minimal-result');
            expect(summary.success).toBe(true);
            expect(summary.score).toBe(1.0);
            expect(summary.provider?.id).toBe('minimal-provider');
        });
        it('should handle long output strings by truncating them', () => {
            const longOutput = 'A'.repeat(1000);
            const resultWithLongOutput = {
                ...createTestEvaluateResult(),
                response: {
                    output: longOutput,
                    cached: false,
                },
            };
            const summary = (0, json_1.summarizeEvaluateResultForLogging)(resultWithLongOutput, 100);
            expect(summary.response?.output?.length).toBeLessThanOrEqual(115); // 100 + '...[truncated]'
            expect(summary.response?.output).toContain('...[truncated]');
        });
        it('should be safely stringifiable', () => {
            const testResult = createTestEvaluateResult();
            const summary = (0, json_1.summarizeEvaluateResultForLogging)(testResult);
            expect(() => {
                const result = (0, json_1.safeJsonStringify)(summary);
                expect(result).toBeDefined();
                expect(typeof result).toBe('string');
            }).not.toThrow();
        });
        it('should handle non-string output values', () => {
            const resultWithObjectOutput = {
                ...createTestEvaluateResult(),
                response: {
                    output: { complexObject: 'value', nested: { data: 'test' } },
                    cached: false,
                },
            };
            const summary = (0, json_1.summarizeEvaluateResultForLogging)(resultWithObjectOutput);
            expect(summary.response?.output).toBe('[object Object]');
        });
        describe('Integration test - evaluator error logging scenario', () => {
            it('should handle the exact scenario from evaluator.ts without throwing', () => {
                const testEvalResult = createTestEvaluateResult();
                const mockError = new Error('Database connection failed');
                expect(() => {
                    const resultSummary = (0, json_1.summarizeEvaluateResultForLogging)(testEvalResult);
                    const logMessage = `Error saving result: ${mockError} ${(0, json_1.safeJsonStringify)(resultSummary)}`;
                    expect(logMessage).toBeDefined();
                    expect(logMessage).toContain('Error saving result: Error: Database connection failed');
                    expect(logMessage).toContain('"id":"test-eval-result"');
                    expect(logMessage).toContain('"success":false');
                    expect(logMessage.length).toBeLessThan(5000);
                }).not.toThrow();
            });
            it('should perform efficiently', () => {
                const testResult = createTestEvaluateResult();
                const start = Date.now();
                const summary = (0, json_1.summarizeEvaluateResultForLogging)(testResult);
                const stringified = (0, json_1.safeJsonStringify)(summary);
                const duration = Date.now() - start;
                expect(duration).toBeLessThan(100);
                expect(stringified).toBeDefined();
            });
        });
    });
});
//# sourceMappingURL=json.test.js.map