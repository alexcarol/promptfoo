"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const baseTool_1 = require("../../../../src/commands/mcp/lib/baseTool");
const errors_1 = require("../../../../src/commands/mcp/lib/errors");
// Mock MCP server
const mockMcpServer = {
    tool: jest.fn(),
};
// Test implementation of AbstractTool
class TestTool extends baseTool_1.AbstractTool {
    constructor() {
        super(...arguments);
        this.name = 'test_tool';
        this.description = 'A test tool for unit testing';
        this.schema = zod_1.z.object({
            input: zod_1.z.string().min(1, 'Input cannot be empty'),
            optional: zod_1.z.number().optional(),
        });
    }
    async execute(args) {
        if (args.input === 'error') {
            throw new Error('Test error');
        }
        return this.success({ message: `Processed: ${args.input}`, optional: args.optional });
    }
}
// Test tool without schema validation
class NoSchemaTestTool extends baseTool_1.AbstractTool {
    constructor() {
        super(...arguments);
        this.name = 'no_schema_tool';
        this.description = 'A test tool without schema validation';
    }
    async execute(args) {
        return this.success({ args });
    }
}
// Test tool that uses helper methods
class HelperMethodsTool extends baseTool_1.AbstractTool {
    constructor() {
        super(...arguments);
        this.name = 'helper_methods_tool';
        this.description = 'A test tool that uses helper methods';
    }
    async execute(args) {
        const value = this.validateRequired(args.value, 'value');
        if (args.timeout) {
            await this.withTimeout(new Promise((resolve) => setTimeout(resolve, 50)), args.timeout, 'operation');
        }
        return this.success({ processedValue: value });
    }
}
describe('AbstractTool', () => {
    let testTool;
    let noSchemaTestTool;
    let helperMethodsTool;
    beforeEach(() => {
        testTool = new TestTool();
        noSchemaTestTool = new NoSchemaTestTool();
        helperMethodsTool = new HelperMethodsTool();
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('basic properties', () => {
        it('should have correct name and description', () => {
            expect(testTool.name).toBe('test_tool');
            expect(testTool.description).toBe('A test tool for unit testing');
        });
    });
    describe('register method', () => {
        it('should register tool with MCP server with schema', () => {
            testTool.register(mockMcpServer);
            expect(mockMcpServer.tool).toHaveBeenCalledWith('test_tool', expect.any(zod_1.z.ZodObject), expect.any(Function));
        });
        it('should register tool without schema', () => {
            noSchemaTestTool.register(mockMcpServer);
            expect(mockMcpServer.tool).toHaveBeenCalledWith('no_schema_tool', {}, expect.any(Function));
        });
        it('should handle tool execution with valid arguments', async () => {
            testTool.register(mockMcpServer);
            const toolHandler = mockMcpServer.tool.mock.calls[0][2];
            const result = await toolHandler({ input: 'test input', optional: 42 });
            expect(result.isError).toBe(false);
            const parsedContent = JSON.parse(result.content[0].text);
            expect(parsedContent.success).toBe(true);
            expect(parsedContent.data).toEqual({
                message: 'Processed: test input',
                optional: 42,
            });
        });
        it('should handle validation errors', async () => {
            testTool.register(mockMcpServer);
            const toolHandler = mockMcpServer.tool.mock.calls[0][2];
            const result = await toolHandler({ input: '' }); // Empty string should fail validation
            expect(result.isError).toBe(true); // createToolResponse returns isError based on success flag
            const parsedContent = JSON.parse(result.content[0].text);
            expect(parsedContent.success).toBe(false);
            expect(parsedContent.error).toContain('Invalid arguments');
        });
        it('should handle execution errors', async () => {
            testTool.register(mockMcpServer);
            const toolHandler = mockMcpServer.tool.mock.calls[0][2];
            const result = await toolHandler({ input: 'error' });
            expect(result.isError).toBe(true); // createToolResponse returns isError based on success flag
            const parsedContent = JSON.parse(result.content[0].text);
            expect(parsedContent.success).toBe(false);
            expect(parsedContent.error).toBe('Test error');
        });
        it('should handle unknown errors', async () => {
            const throwingTool = new (class extends baseTool_1.AbstractTool {
                constructor() {
                    super(...arguments);
                    this.name = 'throwing_tool';
                    this.description = 'Tool that throws unknown error';
                }
                async execute() {
                    throw 'string error'; // Non-Error object
                }
            })();
            throwingTool.register(mockMcpServer);
            const toolHandler = mockMcpServer.tool.mock.calls[0][2];
            const result = await toolHandler({});
            const parsedContent = JSON.parse(result.content[0].text);
            expect(parsedContent.success).toBe(false);
            expect(parsedContent.error).toBe('Unknown error occurred');
        });
        it('should handle tools without schema validation', async () => {
            noSchemaTestTool.register(mockMcpServer);
            const toolHandler = mockMcpServer.tool.mock.calls[0][2];
            const result = await toolHandler({ anything: 'goes' });
            expect(result.isError).toBe(false);
            const parsedContent = JSON.parse(result.content[0].text);
            expect(parsedContent.success).toBe(true);
            expect(parsedContent.data).toEqual({ args: { anything: 'goes' } });
        });
    });
    describe('helper methods', () => {
        describe('success method', () => {
            it('should create successful response', () => {
                const result = testTool['success']({ message: 'success' });
                expect(result.isError).toBe(false);
                const parsedContent = JSON.parse(result.content[0].text);
                expect(parsedContent.success).toBe(true);
                expect(parsedContent.data).toEqual({ message: 'success' });
            });
        });
        describe('error method', () => {
            it('should create error response', () => {
                const result = testTool['error']('Something went wrong', { code: 500 });
                expect(result.isError).toBe(true);
                const parsedContent = JSON.parse(result.content[0].text);
                expect(parsedContent.success).toBe(false);
                expect(parsedContent.error).toBe('Something went wrong');
                // Error responses don't include data in createToolResponse
                expect(parsedContent.data).toBeUndefined();
            });
            it('should create error response without details', () => {
                const result = testTool['error']('Something went wrong');
                const parsedContent = JSON.parse(result.content[0].text);
                expect(parsedContent.success).toBe(false);
                expect(parsedContent.error).toBe('Something went wrong');
                expect(parsedContent.data).toBeUndefined();
            });
        });
        describe('validateRequired method', () => {
            it('should return value when it exists', () => {
                const result = testTool['validateRequired']('test value', 'field');
                expect(result).toBe('test value');
            });
            it('should throw error when value is undefined', () => {
                expect(() => testTool['validateRequired'](undefined, 'field')).toThrow('Missing required field: field');
            });
            it('should throw error when value is null', () => {
                expect(() => testTool['validateRequired'](null, 'field')).toThrow('Missing required field: field');
            });
            it('should allow falsy but defined values', () => {
                expect(testTool['validateRequired']('', 'field')).toBe('');
                expect(testTool['validateRequired'](0, 'field')).toBe(0);
                expect(testTool['validateRequired'](false, 'field')).toBe(false);
            });
        });
        describe('withTimeout method', () => {
            it('should resolve when promise resolves before timeout', async () => {
                const promise = Promise.resolve('success');
                const result = await testTool['withTimeout'](promise, 1000, 'operation');
                expect(result).toBe('success');
            });
            it('should reject when promise times out', async () => {
                const promise = new Promise((resolve) => setTimeout(() => resolve('late'), 100));
                await expect(testTool['withTimeout'](promise, 50, 'operation')).rejects.toThrow('operation timed out after 50ms');
            });
            it('should reject with original error if promise rejects', async () => {
                const promise = Promise.reject(new Error('Original error'));
                await expect(testTool['withTimeout'](promise, 1000, 'operation')).rejects.toThrow('Original error');
            });
        });
    });
    describe('integration with helper methods tool', () => {
        it('should use validateRequired in execution', async () => {
            helperMethodsTool.register(mockMcpServer);
            const toolHandler = mockMcpServer.tool.mock.calls[0][2];
            const result = await toolHandler({ value: 'test' });
            const parsedContent = JSON.parse(result.content[0].text);
            expect(parsedContent.success).toBe(true);
            expect(parsedContent.data).toEqual({ processedValue: 'test' });
        });
        it('should handle validateRequired errors', async () => {
            helperMethodsTool.register(mockMcpServer);
            const toolHandler = mockMcpServer.tool.mock.calls[0][2];
            const result = await toolHandler({}); // Missing required value
            const parsedContent = JSON.parse(result.content[0].text);
            expect(parsedContent.success).toBe(false);
            expect(parsedContent.error).toBe('Missing required field: value');
        });
        it('should handle timeout scenarios', async () => {
            helperMethodsTool.register(mockMcpServer);
            const toolHandler = mockMcpServer.tool.mock.calls[0][2];
            const result = await toolHandler({ value: 'test', timeout: 25 }); // Timeout before 50ms delay
            const parsedContent = JSON.parse(result.content[0].text);
            expect(parsedContent.success).toBe(false);
            expect(parsedContent.error).toContain('timed out');
        });
        it('should succeed when operation completes within timeout', async () => {
            helperMethodsTool.register(mockMcpServer);
            const toolHandler = mockMcpServer.tool.mock.calls[0][2];
            const result = await toolHandler({ value: 'test', timeout: 100 }); // Timeout after 50ms delay
            const parsedContent = JSON.parse(result.content[0].text);
            expect(parsedContent.success).toBe(true);
            expect(parsedContent.data).toEqual({ processedValue: 'test' });
        });
    });
    describe('error handling with MCP errors', () => {
        it('should handle ValidationError with toJSON', async () => {
            const validationErrorTool = new (class extends baseTool_1.AbstractTool {
                constructor() {
                    super(...arguments);
                    this.name = 'validation_error_tool';
                    this.description = 'Tool that throws ValidationError';
                }
                async execute() {
                    throw new errors_1.ValidationError('Custom validation error', { field: 'test' });
                }
            })();
            validationErrorTool.register(mockMcpServer);
            const toolHandler = mockMcpServer.tool.mock.calls[0][2];
            const result = await toolHandler({});
            const parsedContent = JSON.parse(result.content[0].text);
            expect(parsedContent.success).toBe(false);
            expect(parsedContent.error).toBe('Custom validation error');
            // In error cases, data from isMcpError(error) ? error.toJSON() is not included in response
            expect(parsedContent.data).toBeUndefined();
        });
    });
    describe('schema validation edge cases', () => {
        it('should handle complex schema validation', async () => {
            const complexSchemaTool = new (class extends baseTool_1.AbstractTool {
                constructor() {
                    super(...arguments);
                    this.name = 'complex_schema_tool';
                    this.description = 'Tool with complex schema';
                    this.schema = zod_1.z.object({
                        required: zod_1.z.string().min(1),
                        nested: zod_1.z.object({
                            value: zod_1.z.number().positive(),
                        }),
                        array: zod_1.z.array(zod_1.z.string()).min(1),
                    });
                }
                async execute() {
                    return this.success({ status: 'ok' });
                }
            })();
            complexSchemaTool.register(mockMcpServer);
            const toolHandler = mockMcpServer.tool.mock.calls[0][2];
            // Test with invalid data
            const result = await toolHandler({
                required: '',
                nested: { value: -1 },
                array: [],
            });
            const parsedContent = JSON.parse(result.content[0].text);
            expect(parsedContent.success).toBe(false);
            expect(parsedContent.error).toContain('Invalid arguments');
        });
    });
});
//# sourceMappingURL=base-tool.test.js.map