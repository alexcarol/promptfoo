"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const baseTool_1 = require("../../../../src/commands/mcp/lib/baseTool");
// Mock implementation for testing
class TestTool extends baseTool_1.AbstractTool {
    constructor() {
        super(...arguments);
        this.name = 'test_tool';
        this.description = 'A test tool';
        this.schema = zod_1.z.object({
            input: zod_1.z.string(),
            count: zod_1.z.number().optional(),
        });
    }
    async execute(args) {
        const { input, count } = this.schema.parse(args);
        return this.success({
            message: `Processed: ${input}`,
            count: count || 0,
        });
    }
}
// Tool without schema for testing
class NoSchemaTool extends baseTool_1.AbstractTool {
    constructor() {
        super(...arguments);
        this.name = 'no_schema_tool';
        this.description = 'A tool without schema';
    }
    async execute(args) {
        return this.success({ args });
    }
}
// Tool that throws errors for testing
class ErrorTool extends baseTool_1.AbstractTool {
    constructor() {
        super(...arguments);
        this.name = 'error_tool';
        this.description = 'A tool that throws errors';
    }
    async execute(_args) {
        throw new Error('Test error');
    }
}
describe('AbstractTool', () => {
    let mockServer;
    let toolHandler;
    beforeEach(() => {
        // Create a mock MCP server
        mockServer = {
            tool: jest.fn((_name, _schema, handler) => {
                toolHandler = handler;
            }),
        };
    });
    describe('registration', () => {
        it('should register tool with server', () => {
            const tool = new TestTool();
            tool.register(mockServer);
            expect(mockServer.tool).toHaveBeenCalledWith('test_tool', expect.any(Object), expect.any(Function));
        });
        it('should register tool without schema', () => {
            const tool = new NoSchemaTool();
            tool.register(mockServer);
            expect(mockServer.tool).toHaveBeenCalledWith('no_schema_tool', {}, expect.any(Function));
        });
    });
    describe('execution', () => {
        it('should execute successfully with valid input', async () => {
            const tool = new TestTool();
            tool.register(mockServer);
            const result = await toolHandler({ input: 'test', count: 5 });
            expect(result).toMatchObject({
                content: [
                    {
                        type: 'text',
                        text: expect.stringContaining('test_tool'),
                    },
                ],
                isError: false,
            });
            const response = JSON.parse(result.content[0].text);
            expect(response.data).toEqual({
                message: 'Processed: test',
                count: 5,
            });
        });
        it('should validate schema when provided', async () => {
            const tool = new TestTool();
            tool.register(mockServer);
            const result = await toolHandler({ input: 123 }); // Invalid type
            expect(result.isError).toBe(true);
            const response = JSON.parse(result.content[0].text);
            expect(response.error).toContain('Invalid arguments');
        });
        it('should handle missing required fields', async () => {
            const tool = new TestTool();
            tool.register(mockServer);
            const result = await toolHandler({ count: 5 }); // Missing required 'input'
            expect(result.isError).toBe(true);
            const response = JSON.parse(result.content[0].text);
            expect(response.error).toContain('Invalid arguments');
        });
        it('should execute without schema validation', async () => {
            const tool = new NoSchemaTool();
            tool.register(mockServer);
            const args = { any: 'data', nested: { value: 123 } };
            const result = await toolHandler(args);
            expect(result.isError).toBe(false);
            const response = JSON.parse(result.content[0].text);
            expect(response.data.args).toEqual(args);
        });
    });
    describe('error handling', () => {
        it('should handle execution errors gracefully', async () => {
            const tool = new ErrorTool();
            tool.register(mockServer);
            const result = await toolHandler({});
            expect(result.isError).toBe(true);
            const response = JSON.parse(result.content[0].text);
            expect(response.error).toBe('Test error');
        });
    });
    describe('helper methods', () => {
        it('should validate required fields', () => {
            const tool = new TestTool();
            expect(() => tool['validateRequired'](null, 'field')).toThrow('Missing required field: field');
            expect(() => tool['validateRequired'](undefined, 'field')).toThrow('Missing required field: field');
            expect(tool['validateRequired']('value', 'field')).toBe('value');
            expect(tool['validateRequired'](0, 'field')).toBe(0);
            expect(tool['validateRequired'](false, 'field')).toBe(false);
        });
        it('should handle timeout operations', async () => {
            const tool = new TestTool();
            // Test successful operation
            const quickPromise = Promise.resolve('success');
            const result = await tool['withTimeout'](quickPromise, 1000, 'test operation');
            expect(result).toBe('success');
            // Test timeout
            const slowPromise = new Promise((resolve) => setTimeout(resolve, 100));
            await expect(tool['withTimeout'](slowPromise, 10, 'test operation')).rejects.toThrow('test operation timed out after 10ms');
        });
    });
});
//# sourceMappingURL=baseTool.test.js.map