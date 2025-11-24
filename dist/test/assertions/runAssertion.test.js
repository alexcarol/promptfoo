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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const index_1 = require("../../src/assertions/index");
const chat_1 = require("../../src/providers/openai/chat");
const defaults_1 = require("../../src/providers/openai/defaults");
const index_2 = require("../../src/util/fetch/index");
const utils_1 = require("../util/utils");
jest.mock('../../src/redteam/remoteGeneration', () => ({
    shouldGenerateRemote: jest.fn().mockReturnValue(false),
}));
// Causes a SIGSEGV in github actions.
jest.mock('better-sqlite3');
jest.mock('proxy-agent', () => ({
    ProxyAgent: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('node:module', () => {
    const mockRequire = {
        resolve: jest.fn(),
    };
    return {
        createRequire: jest.fn().mockReturnValue(mockRequire),
    };
});
jest.mock('../../src/util/fetch/index.ts', () => {
    const actual = jest.requireActual('../../src/util/fetch/index.ts');
    return {
        ...actual,
        fetchWithRetries: jest.fn(actual.fetchWithRetries),
    };
});
jest.mock('glob', () => ({
    globSync: jest.fn(),
}));
jest.mock('fs', () => ({
    readFileSync: jest.fn(),
    promises: {
        readFile: jest.fn(),
    },
}));
jest.mock('../../src/esm');
jest.mock('../../src/database', () => ({
    getDb: jest.fn(),
}));
jest.mock('path', () => ({
    ...jest.requireActual('path'),
    resolve: jest.fn(jest.requireActual('path').resolve),
    extname: jest.fn(jest.requireActual('path').extname),
}));
jest.mock('../../src/cliState', () => ({
    basePath: '/base/path',
}));
jest.mock('../../src/matchers', () => {
    const actual = jest.requireActual('../../src/matchers');
    return {
        ...actual,
        matchesContextRelevance: jest
            .fn()
            .mockResolvedValue({ pass: true, score: 1, reason: 'Mocked reason' }),
        matchesContextFaithfulness: jest
            .fn()
            .mockResolvedValue({ pass: true, score: 1, reason: 'Mocked reason' }),
    };
});
const Grader = new utils_1.TestGrader();
describe('runAssertion', () => {
    beforeEach(() => {
        jest.resetModules();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    const equalityAssertion = {
        type: 'equals',
        value: 'Expected output',
    };
    const equalityAssertionWithObject = {
        type: 'equals',
        value: { key: 'value' },
    };
    const isJsonAssertion = {
        type: 'is-json',
    };
    const isJsonAssertionWithSchema = {
        type: 'is-json',
        value: {
            required: ['latitude', 'longitude'],
            type: 'object',
            properties: {
                latitude: {
                    type: 'number',
                    minimum: -90,
                    maximum: 90,
                },
                longitude: {
                    type: 'number',
                    minimum: -180,
                    maximum: 180,
                },
            },
        },
    };
    const isJsonAssertionWithSchemaYamlString = {
        type: 'is-json',
        value: `
          required: ["latitude", "longitude"]
          type: object
          properties:
            latitude:
              type: number
              minimum: -90
              maximum: 90
            longitude:
              type: number
              minimum: -180
              maximum: 180
`,
    };
    const isSqlAssertion = {
        type: 'is-sql',
    };
    const notIsSqlAssertion = {
        type: 'not-is-sql',
    };
    const isSqlAssertionWithDatabase = {
        type: 'is-sql',
        value: {
            databaseType: 'MySQL',
        },
    };
    const isSqlAssertionWithDatabaseAndWhiteTableList = {
        type: 'is-sql',
        value: {
            databaseType: 'MySQL',
            allowedTables: ['(select|update|insert|delete)::null::departments'],
        },
    };
    const isSqlAssertionWithDatabaseAndWhiteColumnList = {
        type: 'is-sql',
        value: {
            databaseType: 'MySQL',
            allowedColumns: ['select::null::name', 'update::null::id'],
        },
    };
    const isSqlAssertionWithDatabaseAndBothList = {
        type: 'is-sql',
        value: {
            databaseType: 'MySQL',
            allowedTables: ['(select|update|insert|delete)::null::departments'],
            allowedColumns: ['select::null::name', 'update::null::id'],
        },
    };
    const containsJsonAssertion = {
        type: 'contains-json',
    };
    const containsJsonAssertionWithSchema = {
        type: 'contains-json',
        value: {
            required: ['latitude', 'longitude'],
            type: 'object',
            properties: {
                latitude: {
                    type: 'number',
                    minimum: -90,
                    maximum: 90,
                },
                longitude: {
                    type: 'number',
                    minimum: -180,
                    maximum: 180,
                },
            },
        },
    };
    const javascriptStringAssertion = {
        type: 'javascript',
        value: 'output === "Expected output"',
    };
    const javascriptStringAssertionWithNumber = {
        type: 'javascript',
        value: 'output.length * 10',
    };
    const javascriptBooleanAssertionWithConfig = {
        type: 'javascript',
        value: 'output.length <= context.config.maximumOutputSize',
        config: {
            maximumOutputSize: 20,
        },
    };
    const javascriptStringAssertionWithNumberAndThreshold = {
        type: 'javascript',
        value: 'output.length * 10',
        threshold: 0.5,
    };
    it('should pass when the equality assertion passes', async () => {
        const output = 'Expected output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: equalityAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the equality assertion fails', async () => {
        const output = 'Actual output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: equalityAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output "Actual output" to equal "Expected output"',
        });
    });
    const notEqualsAssertion = {
        type: 'not-equals',
        value: 'Unexpected output',
    };
    it('should pass when the not-equals assertion passes', async () => {
        const output = 'Expected output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: notEqualsAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the not-equals assertion fails', async () => {
        const output = 'Unexpected output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: notEqualsAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output "Unexpected output" to not equal "Unexpected output"',
        });
    });
    it('should handle output as an object', async () => {
        const output = { key: 'value' };
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: equalityAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output "{"key":"value"}" to equal "Expected output"',
        });
    });
    it('should pass when the equality assertion with object passes', async () => {
        const output = { key: 'value' };
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: equalityAssertionWithObject,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the equality assertion with object fails', async () => {
        const output = { key: 'not value' };
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: equalityAssertionWithObject,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output "{"key":"not value"}" to equal "{"key":"value"}"',
        });
    });
    it('should pass when the equality assertion with object passes with external json', async () => {
        const assertion = {
            type: 'equals',
            value: 'file:///output.json',
        };
        jest.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ key: 'value' }));
        const output = '{"key":"value"}';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion,
            test: {},
            providerResponse: { output },
        });
        expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve('/output.json'), 'utf8');
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the equality assertion with object fails with external object', async () => {
        const assertion = {
            type: 'equals',
            value: 'file:///output.json',
        };
        jest.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ key: 'value' }));
        const output = '{"key":"not value"}';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion,
            test: {},
            providerResponse: { output },
        });
        expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve('/output.json'), 'utf8');
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output "{"key":"not value"}" to equal "{"key":"value"}"',
        });
    });
    it('should pass when the is-json assertion passes', async () => {
        const output = '{"key":"value"}';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isJsonAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the is-json assertion fails', async () => {
        const output = 'Not valid JSON';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isJsonAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output to be valid JSON',
        });
    });
    it('should pass when the is-json assertion passes with schema', async () => {
        const output = '{"latitude": 80.123, "longitude": -1}';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isJsonAssertionWithSchema,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the is-json assertion fails with schema', async () => {
        const output = '{"latitude": "high", "longitude": [-1]}';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isJsonAssertionWithSchema,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'JSON does not conform to the provided schema. Errors: data/latitude must be number',
        });
    });
    it('should pass when the is-json assertion passes with schema YAML string', async () => {
        const output = '{"latitude": 80.123, "longitude": -1}';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isJsonAssertionWithSchemaYamlString,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the is-json assertion fails with schema YAML string', async () => {
        const output = '{"latitude": "high", "longitude": [-1]}';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isJsonAssertionWithSchemaYamlString,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'JSON does not conform to the provided schema. Errors: data/latitude must be number',
        });
    });
    it('should validate JSON with formats using ajv-formats', async () => {
        const output = '{"date": "2021-08-29"}';
        const schemaWithFormat = {
            type: 'object',
            properties: {
                date: {
                    type: 'string',
                    format: 'date',
                },
            },
            required: ['date'],
        };
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: { type: 'is-json', value: schemaWithFormat },
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should validate JSON with formats using ajv-formats - failure', async () => {
        const output = '{"date": "not a date"}';
        const schemaWithFormat = {
            type: 'object',
            properties: {
                date: {
                    type: 'string',
                    format: 'date',
                },
            },
            required: ['date'],
        };
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: { type: 'is-json', value: schemaWithFormat },
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'JSON does not conform to the provided schema. Errors: data/date must match format "date"',
        });
    });
    it('should pass when the is-json assertion passes with external schema', async () => {
        const assertion = {
            type: 'is-json',
            value: 'file:///schema.json',
        };
        jest.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
            required: ['latitude', 'longitude'],
            type: 'object',
            properties: {
                latitude: {
                    type: 'number',
                    minimum: -90,
                    maximum: 90,
                },
                longitude: {
                    type: 'number',
                    minimum: -180,
                    maximum: 180,
                },
            },
        }));
        const output = '{"latitude": 80.123, "longitude": -1}';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion,
            test: {},
            providerResponse: { output },
        });
        expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve('/schema.json'), 'utf8');
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the is-json assertion fails with external schema', async () => {
        const assertion = {
            type: 'is-json',
            value: 'file:///schema.json',
        };
        jest.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
            required: ['latitude', 'longitude'],
            type: 'object',
            properties: {
                latitude: {
                    type: 'number',
                    minimum: -90,
                    maximum: 90,
                },
                longitude: {
                    type: 'number',
                    minimum: -180,
                    maximum: 180,
                },
            },
        }));
        const output = '{"latitude": "high", "longitude": [-1]}';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion,
            test: {},
            providerResponse: { output },
        });
        expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve('/schema.json'), 'utf8');
        expect(result).toMatchObject({
            pass: false,
            reason: 'JSON does not conform to the provided schema. Errors: data/latitude must be number',
        });
    });
    it('should pass when the is-sql assertion passes', async () => {
        const output = 'SELECT id, name FROM users';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isSqlAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the is-sql assertion fails', async () => {
        const output = 'SELECT * FROM orders ORDERY BY order_date';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isSqlAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'SQL statement does not conform to the provided MySQL database syntax.',
        });
    });
    it('should pass when the not-is-sql assertion passes', async () => {
        const output = 'SELECT * FROM orders ORDERY BY order_date';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: notIsSqlAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the not-is-sql assertion fails', async () => {
        const output = 'SELECT id, name FROM users';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: notIsSqlAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'The output SQL statement is valid',
        });
    });
    it('should pass when the is-sql assertion passes given MySQL Database syntax', async () => {
        const output = 'SELECT id, name FROM users';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isSqlAssertionWithDatabase,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the is-sql assertion fails given MySQL Database syntax', async () => {
        const output = `SELECT first_name, last_name FROM employees WHERE first_name ILIKE 'john%'`;
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isSqlAssertionWithDatabase,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'SQL statement does not conform to the provided MySQL database syntax.',
        });
    });
    it('should pass when the is-sql assertion passes given MySQL Database syntax and allowedTables', async () => {
        const output = 'SELECT * FROM departments WHERE department_id = 1';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isSqlAssertionWithDatabaseAndWhiteTableList,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the is-sql assertion fails given MySQL Database syntax and allowedTables', async () => {
        const output = 'UPDATE employees SET department_id = 2 WHERE employee_id = 1';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isSqlAssertionWithDatabaseAndWhiteTableList,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: `SQL validation failed: authority = 'update::null::employees' is required in table whiteList to execute SQL = 'UPDATE employees SET department_id = 2 WHERE employee_id = 1'.`,
        });
    });
    it('should pass when the is-sql assertion passes given MySQL Database syntax and allowedColumns', async () => {
        const output = 'SELECT name FROM t';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isSqlAssertionWithDatabaseAndWhiteColumnList,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the is-sql assertion fails given MySQL Database syntax and allowedColumns', async () => {
        const output = 'SELECT age FROM a WHERE id = 1';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isSqlAssertionWithDatabaseAndWhiteColumnList,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: `SQL validation failed: authority = 'select::null::age' is required in column whiteList to execute SQL = 'SELECT age FROM a WHERE id = 1'.`,
        });
    });
    it('should pass when the is-sql assertion passes given MySQL Database syntax, allowedTables, and allowedColumns', async () => {
        const output = 'SELECT name FROM departments';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isSqlAssertionWithDatabaseAndBothList,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the is-sql assertion fails given MySQL Database syntax, allowedTables, and allowedColumns', async () => {
        const output = `INSERT INTO departments (name) VALUES ('HR')`;
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isSqlAssertionWithDatabaseAndBothList,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: `SQL validation failed: authority = 'insert::departments::name' is required in column whiteList to execute SQL = 'INSERT INTO departments (name) VALUES ('HR')'.`,
        });
    });
    it('should fail when the is-sql assertion fails due to missing table authority for MySQL Database syntax', async () => {
        const output = 'UPDATE a SET id = 1';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isSqlAssertionWithDatabaseAndBothList,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: `SQL validation failed: authority = 'update::null::a' is required in table whiteList to execute SQL = 'UPDATE a SET id = 1'.`,
        });
    });
    it('should fail when the is-sql assertion fails due to missing authorities for DELETE statement in MySQL Database syntax', async () => {
        const output = `DELETE FROM employees;`;
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: isSqlAssertionWithDatabaseAndBothList,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: `SQL validation failed: authority = 'delete::null::employees' is required in table whiteList to execute SQL = 'DELETE FROM employees;'. SQL validation failed: authority = 'delete::employees::(.*)' is required in column whiteList to execute SQL = 'DELETE FROM employees;'.`,
        });
    });
    it('should pass when the contains-sql assertion passes', async () => {
        const output = 'wassup\n```\nSELECT id, name FROM users\n```\nyolo';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: {
                type: 'contains-sql',
            },
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should pass when the contains-sql assertion sees `sql` in code block', async () => {
        const output = 'wassup\n```sql\nSELECT id, name FROM users\n```\nyolo';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: {
                type: 'contains-sql',
            },
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should pass when the contains-sql assertion sees sql without code block', async () => {
        const output = 'SELECT id, name FROM users';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: {
                type: 'contains-sql',
            },
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the contains-sql does not contain code block', async () => {
        const output = 'nothin';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: {
                type: 'contains-sql',
            },
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
        });
    });
    it('should fail when the contains-sql does not contain sql in code block', async () => {
        const output = '```python\nprint("Hello, World!")\n```';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: {
                type: 'contains-sql',
            },
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
        });
    });
    it('should pass when the contains-json assertion passes', async () => {
        const output = 'this is some other stuff \n\n {"key": "value", "key2": {"key3": "value2", "key4": ["value3", "value4"]}} \n\n blah blah';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: containsJsonAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should pass when the contains-json assertion passes with multiple json values', async () => {
        const output = 'this is some other stuff \n\n {"key": "value", "key2": {"key3": "value2", "key4": ["value3", "value4"]}} another {"key": "value", "key2": {"key3": "value2", "key4": ["value3", "value4"]}}\n\n blah blah';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: containsJsonAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the contains-json assertion fails', async () => {
        const output = 'Not valid JSON';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: containsJsonAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output to contain valid JSON',
        });
    });
    it('should pass when the contains-json assertion passes with schema', async () => {
        const output = 'here is the answer\n\n```{"latitude": 80.123, "longitude": -1}```';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: containsJsonAssertionWithSchema,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should pass when the contains-json assertion passes with schema with YAML string', async () => {
        const output = 'here is the answer\n\n```{"latitude": 80.123, "longitude": -1}```';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: containsJsonAssertionWithSchema,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should pass when the contains-json assertion passes with external schema', async () => {
        const assertion = {
            type: 'contains-json',
            value: 'file:///schema.json',
        };
        jest.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
            required: ['latitude', 'longitude'],
            type: 'object',
            properties: {
                latitude: {
                    type: 'number',
                    minimum: -90,
                    maximum: 90,
                },
                longitude: {
                    type: 'number',
                    minimum: -180,
                    maximum: 180,
                },
            },
        }));
        const output = 'here is the answer\n\n```{"latitude": 80.123, "longitude": -1}```';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion,
            test: {},
            providerResponse: { output },
        });
        expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve('/schema.json'), 'utf8');
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail contains-json assertion with invalid data against external schema', async () => {
        const assertion = {
            type: 'contains-json',
            value: 'file:///schema.json',
        };
        jest.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
            required: ['latitude', 'longitude'],
            type: 'object',
            properties: {
                latitude: {
                    type: 'number',
                    minimum: -90,
                    maximum: 90,
                },
                longitude: {
                    type: 'number',
                    minimum: -180,
                    maximum: 180,
                },
            },
        }));
        const output = 'here is the answer\n\n```{"latitude": "medium", "longitude": -1}```';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion,
            test: {},
            providerResponse: { output },
        });
        expect(fs.readFileSync).toHaveBeenCalledWith(path.resolve('/schema.json'), 'utf8');
        expect(result).toMatchObject({
            pass: false,
            reason: 'JSON does not conform to the provided schema. Errors: data/latitude must be number',
        });
    });
    it('should fail contains-json assertion with predefined schema and invalid data', async () => {
        const output = 'here is the answer\n\n```{"latitude": "medium", "longitude": -1}```';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: containsJsonAssertionWithSchema,
            test: {},
            providerResponse: { output },
        });
        expect(result).toEqual(expect.objectContaining({
            pass: false,
            reason: 'JSON does not conform to the provided schema. Errors: data/latitude must be number',
        }));
    });
    it('should pass when the javascript assertion passes', async () => {
        const output = 'Expected output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: javascriptStringAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should pass a score through when the javascript returns a number', async () => {
        const output = 'Expected output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: javascriptStringAssertionWithNumber,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            score: output.length * 10,
            reason: 'Assertion passed',
        });
    });
    it('should pass when javascript returns an output string that is smaller than the maximum size threshold', async () => {
        const output = 'Expected output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: javascriptBooleanAssertionWithConfig,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            score: 1.0,
            reason: 'Assertion passed',
        });
    });
    it('should disregard invalid inputs for assert index', async () => {
        const output = 'Expected output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: javascriptBooleanAssertionWithConfig,
            test: {
                assert: [
                    {
                        type: 'javascript',
                        value: 'output.length <= context.config.maximumOutputSize',
                        config: {
                            maximumOutputSize: 1,
                        },
                    },
                ],
            },
            providerResponse: { output },
            assertIndex: 45,
        });
        expect(result).toMatchObject({
            pass: true,
            score: 1.0,
            reason: 'Assertion passed',
        });
    });
    it('should fail when javascript returns an output string that is larger than the maximum size threshold', async () => {
        const output = 'Expected output with some extra characters';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: javascriptBooleanAssertionWithConfig,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            score: 0,
            reason: expect.stringContaining('Custom function returned false'),
        });
    });
    it('should pass when javascript returns a number above threshold', async () => {
        const output = 'Expected output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: javascriptStringAssertionWithNumberAndThreshold,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            score: output.length * 10,
            reason: 'Assertion passed',
        });
    });
    it('should fail when javascript returns a number below threshold', async () => {
        const output = '';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: javascriptStringAssertionWithNumberAndThreshold,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            score: output.length * 10,
            reason: expect.stringContaining('Custom function returned false'),
        });
    });
    it('should set score when javascript returns false', async () => {
        const output = 'Test output';
        const assertion = {
            type: 'javascript',
            value: 'output.length < 1',
        };
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            score: 0,
            reason: expect.stringContaining('Custom function returned false'),
        });
    });
    it('should fail when the javascript assertion fails', async () => {
        const output = 'Different output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: javascriptStringAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Custom function returned false\noutput === "Expected output"',
        });
    });
    it('should pass when assertion passes - with vars', async () => {
        const output = 'Expected output';
        const assertion = {
            type: 'equals',
            value: '{{ foo }}',
        };
        const result = await (0, index_1.runAssertion)({
            prompt: 'variable value',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion,
            test: { vars: { foo: 'Expected output' } },
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    const notContainsAssertion = {
        type: 'not-contains',
        value: 'Unexpected output',
    };
    it('should pass when the not-contains assertion passes', async () => {
        const output = 'Expected output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: notContainsAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the not-contains assertion fails', async () => {
        const output = 'Unexpected output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: notContainsAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output to not contain "Unexpected output"',
        });
    });
    // Test for icontains assertion
    const containsLowerAssertion = {
        type: 'icontains',
        value: 'expected output',
    };
    it('should pass when the icontains assertion passes', async () => {
        const output = 'EXPECTED OUTPUT';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: containsLowerAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the icontains assertion fails', async () => {
        const output = 'Different output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: containsLowerAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output to contain "expected output"',
        });
    });
    // Test for not-icontains assertion
    const notContainsLowerAssertion = {
        type: 'not-icontains',
        value: 'unexpected output',
    };
    it('should pass when the not-icontains assertion passes', async () => {
        const output = 'Expected output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: notContainsLowerAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the not-icontains assertion fails', async () => {
        const output = 'UNEXPECTED OUTPUT';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: notContainsLowerAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output to not contain "unexpected output"',
        });
    });
    // Test for contains-any assertion
    const containsAnyAssertion = {
        type: 'contains-any',
        value: ['option1', 'option2', 'option3'],
    };
    it('should pass when the contains-any assertion passes', async () => {
        const output = 'This output contains option1';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: containsAnyAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the contains-any assertion fails', async () => {
        const output = 'This output does not contain any option';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: containsAnyAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output to contain one of "option1, option2, option3"',
        });
    });
    it('should pass when the icontains-any assertion passes', async () => {
        const output = 'This output contains OPTION1';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: {
                type: 'icontains-any',
                value: ['option1', 'option2', 'option3'],
            },
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the icontains-any assertion fails', async () => {
        const output = 'This output does not contain any option';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: {
                type: 'icontains-any',
                value: ['option1', 'option2', 'option3'],
            },
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output to contain one of "option1, option2, option3"',
        });
    });
    // Test for contains-all assertion
    const containsAllAssertion = {
        type: 'contains-all',
        value: ['option1', 'option2', 'option3'],
    };
    it('should pass when the contains-all assertion passes', async () => {
        const output = 'This output contains option1, option2, and option3';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: containsAllAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the contains-all assertion fails', async () => {
        const output = 'This output contains only option1 and option2';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: containsAllAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output to contain all of [option1, option2, option3]. Missing: [option3]',
        });
    });
    it('should pass when the icontains-all assertion passes', async () => {
        const output = 'This output contains OPTION1, option2, and opTiOn3';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: {
                type: 'icontains-all',
                value: ['option1', 'option2', 'option3'],
            },
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the icontains-all assertion fails', async () => {
        const output = 'This output contains OPTION1, option2, and opTiOn3';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: {
                type: 'icontains-all',
                value: ['option1', 'option2', 'option3', 'option4'],
            },
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output to contain all of [option1, option2, option3, option4]. Missing: [option4]',
        });
    });
    // Test for regex assertion
    const containsRegexAssertion = {
        type: 'regex',
        value: '\\d{3}-\\d{2}-\\d{4}',
    };
    it('should pass when the regex assertion passes', async () => {
        const output = 'This output contains 123-45-6789';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: containsRegexAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the regex assertion fails', async () => {
        const output = 'This output does not contain the pattern';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: containsRegexAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output to match regex "\\d{3}-\\d{2}-\\d{4}"',
        });
    });
    // Test for not-regex assertion
    const notContainsRegexAssertion = {
        type: 'not-regex',
        value: '\\d{3}-\\d{2}-\\d{4}',
    };
    it('should pass when the not-regex assertion passes', async () => {
        const output = 'This output does not contain the pattern';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: notContainsRegexAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the not-regex assertion fails', async () => {
        const output = 'This output contains 123-45-6789';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: notContainsRegexAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output to not match regex "\\d{3}-\\d{2}-\\d{4}"',
        });
    });
    // Tests for webhook assertion
    const webhookAssertion = {
        type: 'webhook',
        value: 'https://example.com/webhook',
    };
    it('should pass when the webhook assertion passes', async () => {
        const output = 'Expected output';
        jest.mocked(index_2.fetchWithRetries).mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ pass: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })));
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: webhookAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the webhook assertion fails', async () => {
        const output = 'Different output';
        jest.mocked(index_2.fetchWithRetries).mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ pass: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })));
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: webhookAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Webhook returned false',
        });
    });
    it('should fail when the webhook returns an error', async () => {
        const output = 'Expected output';
        jest.mocked(index_2.fetchWithRetries).mockImplementation(() => Promise.resolve(new Response('', {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })));
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: webhookAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Webhook error: Webhook response status: 500',
        });
    });
    // Test for rouge-n assertion
    const rougeNAssertion = {
        type: 'rouge-n',
        value: 'This is the expected output.',
        threshold: 0.75,
    };
    it('should pass when the rouge-n assertion passes', async () => {
        const output = 'This is the expected output.';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: rougeNAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'ROUGE-N score 1.00 is greater than or equal to threshold 0.75',
        });
    });
    it('should fail when the rouge-n assertion fails', async () => {
        const output = 'some different output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: rougeNAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'ROUGE-N score 0.17 is less than threshold 0.75',
        });
    });
    // Test for starts-with assertion
    const startsWithAssertion = {
        type: 'starts-with',
        value: 'Expected',
    };
    it('should pass when the starts-with assertion passes', async () => {
        const output = 'Expected output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: startsWithAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the starts-with assertion fails', async () => {
        const output = 'Different output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion: startsWithAssertion,
            test: {},
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Expected output to start with "Expected"',
        });
    });
    it('should use the provider from the assertion if it exists', async () => {
        // Assertion grader passes
        const output = 'Expected output';
        const assertion = {
            type: 'llm-rubric',
            value: 'Expected output',
            provider: Grader,
        };
        // Test grader fails
        const BogusGrader = {
            id() {
                return 'BogusGrader';
            },
            async callApi() {
                throw new Error('Should not be called');
            },
        };
        const test = {
            assert: [assertion],
            options: {
                provider: BogusGrader,
            },
        };
        // Expect test to pass because assertion grader takes priority
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            assertion,
            test,
            providerResponse: { output },
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Test grading output',
        });
    });
    // Test for levenshtein assertion
    const levenshteinAssertion = {
        type: 'levenshtein',
        value: 'Expected output',
        threshold: 5,
    };
    it('should pass when the levenshtein assertion passes', async () => {
        const output = 'Expected output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: levenshteinAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: true,
            reason: 'Assertion passed',
        });
    });
    it('should fail when the levenshtein assertion fails', async () => {
        const output = 'Different output';
        const result = await (0, index_1.runAssertion)({
            prompt: 'Some prompt',
            provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            assertion: levenshteinAssertion,
            test: {},
            providerResponse: { output },
        });
        expect(result).toMatchObject({
            pass: false,
            reason: 'Levenshtein distance 8 is greater than threshold 5',
        });
    });
    describe('latency assertion', () => {
        it('should pass when the latency assertion passes', async () => {
            const output = 'Expected output';
            const provider = new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini');
            const providerResponse = { output };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'latency',
                    threshold: 100,
                },
                latencyMs: 50,
                test: {},
                providerResponse,
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Assertion passed',
            });
        });
        it('should fail when the latency assertion fails', async () => {
            const output = 'Expected output';
            const provider = new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini');
            const providerResponse = { output };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'latency',
                    threshold: 100,
                },
                latencyMs: 1000,
                test: {},
                providerResponse,
            });
            expect(result).toMatchObject({
                pass: false,
                reason: 'Latency 1000ms is greater than threshold 100ms',
            });
        });
        it('should throw an error when grading result is missing latencyMs', async () => {
            const output = 'Expected output';
            await expect((0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
                assertion: {
                    type: 'latency',
                    threshold: 100,
                },
                test: {},
                providerResponse: { output },
            })).rejects.toThrow('Latency assertion does not support cached results. Rerun the eval with --no-cache');
        });
        it('should pass when the latency is 0ms', async () => {
            const output = 'Expected output';
            const provider = new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini');
            const providerResponse = { output };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'latency',
                    threshold: 100,
                },
                latencyMs: 0,
                test: {},
                providerResponse,
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Assertion passed',
            });
        });
        it('should throw an error when threshold is not provided', async () => {
            const output = 'Expected output';
            await expect((0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
                assertion: {
                    type: 'latency',
                },
                latencyMs: 50,
                test: {},
                providerResponse: { output },
            })).rejects.toThrow('Latency assertion must have a threshold in milliseconds');
        });
        it('should handle latency equal to threshold', async () => {
            const output = 'Expected output';
            const provider = new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini');
            const providerResponse = { output };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'latency',
                    threshold: 100,
                },
                latencyMs: 100,
                test: {},
                providerResponse,
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Assertion passed',
            });
        });
        it('should NOT throw error when threshold is 0', async () => {
            const output = 'Expected output';
            const provider = new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini');
            const providerResponse = { output };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'latency',
                    threshold: 0,
                },
                latencyMs: 0,
                test: {},
                providerResponse,
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Assertion passed',
            });
        });
        it('should fail when latency exceeds threshold=0', async () => {
            const output = 'Expected output';
            const provider = new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini');
            const providerResponse = { output };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'latency',
                    threshold: 0,
                },
                latencyMs: 1,
                test: {},
                providerResponse,
            });
            expect(result).toMatchObject({
                pass: false,
                reason: 'Latency 1ms is greater than threshold 0ms',
            });
        });
    });
    describe('perplexity assertion', () => {
        it('should pass when the perplexity assertion passes', async () => {
            const logProbs = [-0.2, -0.4, -0.1, -0.3]; // Dummy logProbs for testing
            const provider = {
                callApi: jest.fn().mockResolvedValue({ logProbs }),
            };
            const providerResponse = { output: 'Some output', logProbs };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'perplexity',
                    threshold: 2,
                },
                test: {},
                providerResponse,
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Assertion passed',
            });
        });
        it('should fail when the perplexity assertion fails', async () => {
            const logProbs = [-0.2, -0.4, -0.1, -0.3]; // Dummy logProbs for testing
            const provider = {
                callApi: jest.fn().mockResolvedValue({ logProbs }),
            };
            const providerResponse = { output: 'Some output', logProbs };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'perplexity',
                    threshold: 0.2,
                },
                test: {},
                providerResponse,
            });
            expect(result).toMatchObject({
                pass: false,
                reason: 'Perplexity 1.28 is greater than threshold 0.2',
            });
        });
        it('should PASS when no threshold is specified (default behavior)', async () => {
            const logProbs = [-0.2, -0.4, -0.1, -0.3];
            const provider = {
                callApi: jest.fn().mockResolvedValue({ logProbs }),
            };
            const providerResponse = { output: 'Some output', logProbs };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'perplexity',
                },
                test: {},
                providerResponse,
            });
            expect(result.pass).toBe(true); // No threshold = always pass
        });
        it('should respect threshold=0 as a valid threshold', async () => {
            const logProbs = [-0.2, -0.4, -0.1, -0.3];
            const provider = {
                callApi: jest.fn().mockResolvedValue({ logProbs }),
            };
            const providerResponse = { output: 'Some output', logProbs };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'perplexity',
                    threshold: 0,
                },
                test: {},
                providerResponse,
            });
            // Perplexity will be > 0, so with threshold=0, should fail
            expect(result.pass).toBe(false);
        });
    });
    describe('perplexity-score assertion', () => {
        it('should pass when the perplexity-score assertion passes', async () => {
            const logProbs = [-0.2, -0.4, -0.1, -0.3];
            const provider = {
                callApi: jest.fn().mockResolvedValue({ logProbs }),
            };
            const providerResponse = { output: 'Some output', logProbs };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'perplexity-score',
                    threshold: 0.25,
                },
                test: {},
                providerResponse,
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Assertion passed',
            });
        });
        it('should fail when the perplexity-score assertion fails', async () => {
            const logProbs = [-0.2, -0.4, -0.1, -0.3];
            const provider = {
                callApi: jest.fn().mockResolvedValue({ logProbs }),
            };
            const providerResponse = { output: 'Some output', logProbs };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'perplexity-score',
                    threshold: 0.5,
                },
                test: {},
                providerResponse,
            });
            expect(result).toMatchObject({
                pass: false,
                reason: 'Perplexity score 0.44 is less than threshold 0.5',
            });
        });
        it('should PASS when no threshold is specified for perplexity-score', async () => {
            const logProbs = [-0.2, -0.4, -0.1, -0.3];
            const provider = {
                callApi: jest.fn().mockResolvedValue({ logProbs }),
            };
            const providerResponse = { output: 'Some output', logProbs };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'perplexity-score',
                },
                test: {},
                providerResponse,
            });
            expect(result.pass).toBe(true); // No threshold = always pass
        });
        it('should respect threshold=0 as valid for perplexity-score', async () => {
            const logProbs = [-0.2, -0.4, -0.1, -0.3];
            const provider = {
                callApi: jest.fn().mockResolvedValue({ logProbs }),
            };
            const providerResponse = { output: 'Some output', logProbs };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'perplexity-score',
                    threshold: 0,
                },
                test: {},
                providerResponse,
            });
            // Perplexity score will be > 0, so should pass with threshold=0
            expect(result.pass).toBe(true);
        });
    });
    describe('cost assertion', () => {
        it('should pass when the cost is below the threshold', async () => {
            const cost = 0.0005;
            const provider = {
                callApi: jest.fn().mockResolvedValue({ cost }),
            };
            const providerResponse = { output: 'Some output', cost };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'cost',
                    threshold: 0.001,
                },
                test: {},
                providerResponse,
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Assertion passed',
            });
        });
        it('should fail when the cost exceeds the threshold', async () => {
            const cost = 0.002;
            const provider = {
                callApi: jest.fn().mockResolvedValue({ cost }),
            };
            const providerResponse = { output: 'Some output', cost };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'cost',
                    threshold: 0.001,
                },
                test: {},
                providerResponse,
            });
            expect(result).toMatchObject({
                pass: false,
                reason: 'Cost 0.0020 is greater than threshold 0.001',
            });
        });
        it('should NOT throw error when threshold is 0', async () => {
            const cost = 0;
            const provider = {
                callApi: jest.fn().mockResolvedValue({ cost }),
            };
            const providerResponse = { output: 'Some output', cost };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'cost',
                    threshold: 0,
                },
                test: {},
                providerResponse,
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Assertion passed',
            });
        });
        it('should fail when cost exceeds threshold=0', async () => {
            const cost = 0.01;
            const provider = {
                callApi: jest.fn().mockResolvedValue({ cost }),
            };
            const providerResponse = { output: 'Some output', cost };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider,
                assertion: {
                    type: 'cost',
                    threshold: 0,
                },
                test: {},
                providerResponse,
            });
            expect(result).toMatchObject({
                pass: false,
                reason: 'Cost 0.010 is greater than threshold 0',
            });
        });
    });
    describe('Similarity assertion', () => {
        beforeEach(() => {
            jest.spyOn(defaults_1.DefaultEmbeddingProvider, 'callEmbeddingApi').mockImplementation((text) => {
                if (text === 'Test output' || text.startsWith('Similar output')) {
                    return Promise.resolve({
                        embedding: [1, 0, 0],
                        tokenUsage: { total: 5, prompt: 2, completion: 3 },
                    });
                }
                else if (text.startsWith('Different output')) {
                    return Promise.resolve({
                        embedding: [0, 1, 0],
                        tokenUsage: { total: 5, prompt: 2, completion: 3 },
                    });
                }
                return Promise.reject(new Error('Unexpected input'));
            });
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });
        it('should pass for a similar assertion with a string value', async () => {
            const output = 'Test output';
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                assertion: {
                    type: 'similar',
                    value: 'Similar output',
                },
                test: {},
                providerResponse: { output },
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Similarity 1.00 is greater than or equal to threshold 0.75',
            });
        });
        it('should fail for a similar assertion with a string value', async () => {
            const output = 'Test output';
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                assertion: {
                    type: 'similar',
                    value: 'Different output',
                },
                test: {},
                providerResponse: { output },
            });
            expect(result).toMatchObject({
                pass: false,
                reason: 'Similarity 0.00 is less than threshold 0.75',
            });
        });
        it('should pass for a similar assertion with an array of string values', async () => {
            const output = 'Test output';
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                assertion: {
                    type: 'similar',
                    value: ['Similar output 1', 'Different output 1'],
                },
                test: {},
                providerResponse: { output },
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Similarity 1.00 is greater than or equal to threshold 0.75',
            });
        });
        it('should fail for a similar assertion with an array of string values', async () => {
            const output = 'Test output';
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                assertion: {
                    type: 'similar',
                    value: ['Different output 1', 'Different output 2'],
                },
                test: {},
                providerResponse: { output },
            });
            expect(result).toMatchObject({
                pass: false,
                reason: 'None of the provided values met the similarity threshold',
            });
        });
    });
    describe('is-xml', () => {
        const provider = {
            callApi: jest.fn().mockResolvedValue({ cost: 0.001 }),
        };
        it('should pass when the output is valid XML', async () => {
            const output = '<root><child>Content</child></root>';
            const assertion = { type: 'is-xml' };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: true,
                score: 1,
                reason: 'Assertion passed',
                assertion,
            });
        });
        it('should fail when the output is not valid XML', async () => {
            const output = '<root><child>Content</child></root';
            const assertion = { type: 'is-xml' };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toMatchObject({
                pass: false,
                score: 0,
                reason: expect.stringMatching(/XML parsing failed/),
                assertion,
            });
        });
        it('should pass when required elements are present', async () => {
            const output = '<analysis><classification>T-shirt</classification><color>Red</color></analysis>';
            const assertion = {
                type: 'is-xml',
                value: 'analysis.classification,analysis.color',
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: true,
                score: 1,
                reason: 'Assertion passed',
                assertion,
            });
        });
        it('should fail when required elements are missing', async () => {
            const output = '<analysis><classification>T-shirt</classification></analysis>';
            const assertion = {
                type: 'is-xml',
                value: 'analysis.classification,analysis.color',
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: false,
                score: 0,
                reason: 'XML is missing required elements: analysis.color',
                assertion,
            });
        });
        it('should pass when nested elements are present', async () => {
            const output = '<root><parent><child><grandchild>Content</grandchild></child></parent></root>';
            const assertion = {
                type: 'is-xml',
                value: 'root.parent.child.grandchild',
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: true,
                score: 1,
                reason: 'Assertion passed',
                assertion,
            });
        });
        it('should handle inverse assertion correctly', async () => {
            const output = 'This is not XML';
            const assertion = { type: 'not-is-xml' };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate non-XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: true,
                score: 1,
                reason: 'Assertion passed',
                assertion,
            });
        });
        it('should pass when required elements are specified as an array', async () => {
            const output = '<root><element1>Content1</element1><element2>Content2</element2></root>';
            const assertion = {
                type: 'is-xml',
                value: ['root.element1', 'root.element2'],
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: true,
                score: 1,
                reason: 'Assertion passed',
                assertion,
            });
        });
        it('should pass when required elements are specified as an object', async () => {
            const output = '<root><element1>Content1</element1><element2>Content2</element2></root>';
            const assertion = {
                type: 'contains-xml',
                value: {
                    requiredElements: ['root.element1', 'root.element2'],
                },
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: true,
                score: 1,
                reason: 'Assertion passed',
                assertion,
            });
        });
        it('should throw an error when xml assertion value is invalid', async () => {
            const output = '<root><element1>Content1</element1><element2>Content2</element2></root>';
            const assertion = {
                type: 'is-xml',
                value: { invalidKey: ['root.element1', 'root.element2'] },
            };
            await expect((0, index_1.runAssertion)({
                prompt: 'Generate XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            })).rejects.toThrow('xml assertion must contain a string, array value, or no value');
        });
        it('should handle multiple XML blocks in contains-xml assertion', async () => {
            const output = 'Some text <xml1>content1</xml1> more text <xml2>content2</xml2>';
            const assertion = {
                type: 'contains-xml',
                value: ['xml1', 'xml2'],
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate text with multiple XML blocks',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: true,
                score: 1,
                reason: 'Assertion passed',
                assertion,
            });
        });
    });
    describe('contains-xml', () => {
        const provider = {
            callApi: jest.fn().mockResolvedValue({ cost: 0.001 }),
        };
        it('should pass when the output contains valid XML', async () => {
            const output = 'Some text before <root><child>Content</child></root> and after';
            const assertion = { type: 'contains-xml' };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate text with XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: true,
                score: 1,
                reason: 'Assertion passed',
                assertion,
            });
        });
        it('should fail when the output does not contain valid XML', async () => {
            const output = 'This is just plain text without any XML';
            const assertion = { type: 'contains-xml' };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate text without XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: false,
                score: 0,
                reason: 'No XML content found in the output',
                assertion,
            });
        });
        it('should pass when required elements are present in the XML', async () => {
            const output = 'Before <analysis><classification>T-shirt</classification><color>Red</color></analysis> After';
            const assertion = {
                type: 'contains-xml',
                value: 'analysis.classification,analysis.color',
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate text with specific XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: true,
                score: 1,
                reason: 'Assertion passed',
                assertion,
            });
        });
        it('should fail when required elements are missing in the XML', async () => {
            const output = 'Before <analysis><classification>T-shirt</classification></analysis> After';
            const assertion = {
                type: 'contains-xml',
                value: 'analysis.classification,analysis.color',
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate text with specific XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: false,
                score: 0,
                reason: 'No valid XML content found matching the requirements',
                assertion,
            });
        });
        it('should pass when nested elements are present in the XML', async () => {
            const output = 'Start <root><parent><child><grandchild>Content</grandchild></child></parent></root> End';
            const assertion = {
                type: 'contains-xml',
                value: 'root.parent.child.grandchild',
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate text with nested XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: true,
                score: 1,
                reason: 'Assertion passed',
                assertion,
            });
        });
        it('should handle inverse assertion correctly', async () => {
            const output = 'This is just plain text without any XML';
            const assertion = { type: 'not-contains-xml' };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate text without XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: true,
                score: 1,
                reason: 'Assertion passed',
                assertion,
            });
        });
        it('should fail inverse assertion when XML is present', async () => {
            const output = 'Some text with <xml>content</xml> in it';
            const assertion = { type: 'not-contains-xml' };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Generate text without XML',
                provider,
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toEqual({
                pass: false,
                score: 0,
                reason: 'XML is valid and contains all required elements',
                assertion,
            });
        });
    });
    describe('context-relevance assertion', () => {
        it('should pass when all required vars are present', async () => {
            const assertion = {
                type: 'context-relevance',
                threshold: 0.7,
            };
            const test = {
                vars: {
                    query: 'What is the capital of France?',
                    context: 'Paris is the capital of France.',
                },
            };
            const result = await (0, index_1.runAssertion)({
                assertion,
                test,
                providerResponse: { output: 'Some output' },
            });
            expect(result).toEqual({
                pass: true,
                score: 1,
                reason: 'Mocked reason',
                assertion,
                metadata: {
                    context: 'Paris is the capital of France.',
                },
            });
        });
        it('should throw an error when vars object is missing', async () => {
            const assertion = {
                type: 'context-relevance',
                threshold: 0.7,
            };
            const test = {};
            await expect((0, index_1.runAssertion)({
                assertion,
                test,
                providerResponse: { output: 'Some output' },
            })).rejects.toThrow('context-relevance assertion requires a test with variables');
        });
        it('should throw an error when query var is missing', async () => {
            const assertion = {
                type: 'context-relevance',
                threshold: 0.7,
            };
            const test = {
                vars: {
                    context: 'Paris is the capital of France.',
                },
            };
            await expect((0, index_1.runAssertion)({
                assertion,
                test,
                providerResponse: { output: 'Some output' },
            })).rejects.toThrow('context-relevance assertion requires a "query" variable with the user question');
        });
        it('should throw an error when context var is missing', async () => {
            const assertion = {
                type: 'context-relevance',
                threshold: 0.7,
            };
            const test = {
                vars: {
                    query: 'What is the capital of France?',
                },
            };
            await expect((0, index_1.runAssertion)({
                assertion,
                test,
                providerResponse: { output: 'Some output' },
            })).rejects.toThrow('Context is required for context-based assertions. Provide either a "context" variable (string or array of strings) in your test case or use "contextTransform" to extract context from the provider response.');
        });
    });
    describe('context-faithfulness assertion', () => {
        it('should pass when all required vars are present', async () => {
            const assertion = {
                type: 'context-faithfulness',
                threshold: 0.7,
            };
            const test = {
                vars: {
                    query: 'What is the capital of France?',
                    context: 'Paris is the capital of France.',
                },
            };
            const result = await (0, index_1.runAssertion)({
                assertion,
                test,
                providerResponse: { output: 'The capital of France is Paris.' },
            });
            expect(result).toEqual({
                pass: true,
                score: 1,
                reason: 'Mocked reason',
                assertion,
                metadata: {
                    context: 'Paris is the capital of France.',
                },
            });
        });
        it('should throw an error when vars object is missing', async () => {
            const assertion = {
                type: 'context-faithfulness',
                threshold: 0.7,
            };
            const test = {};
            await expect((0, index_1.runAssertion)({
                assertion,
                test,
                providerResponse: { output: 'Some output' },
            })).rejects.toThrow('context-faithfulness assertion requires a test with variables');
        });
        it('should throw an error when query var is missing', async () => {
            const assertion = {
                type: 'context-faithfulness',
                threshold: 0.7,
            };
            const test = {
                vars: {
                    context: 'Paris is the capital of France.',
                },
            };
            await expect((0, index_1.runAssertion)({
                assertion,
                test,
                providerResponse: { output: 'Some output' },
            })).rejects.toThrow('context-faithfulness assertion requires a "query" variable with the user question');
        });
        it('should throw an error when context var is missing', async () => {
            const assertion = {
                type: 'context-faithfulness',
                threshold: 0.7,
            };
            const test = {
                vars: {
                    query: 'What is the capital of France?',
                },
            };
            await expect((0, index_1.runAssertion)({
                assertion,
                test,
                providerResponse: { output: 'Some output' },
            })).rejects.toThrow('Context is required for context-based assertions. Provide either a "context" variable (string or array of strings) in your test case or use "contextTransform" to extract context from the provider response.');
        });
        it('should throw an error when output is not a string', async () => {
            const assertion = {
                type: 'context-faithfulness',
                threshold: 0.7,
            };
            const test = {
                vars: {
                    query: 'What is the capital of France?',
                    context: 'Paris is the capital of France.',
                },
            };
            await expect((0, index_1.runAssertion)({
                assertion,
                test,
                providerResponse: { output: { some: 'object' } },
            })).rejects.toThrow('context-faithfulness assertion requires string output from the provider');
        });
    });
    describe('assertion transform with metadata', () => {
        it('should pass metadata to assertion transform when available', async () => {
            const output = 'Test output';
            const metadata = { key: 'value', nested: { data: 123 } };
            const assertion = {
                type: 'equals',
                value: 'Metadata: {"key":"value","nested":{"data":123}}',
                transform: 'context.metadata ? `Metadata: ${JSON.stringify(context.metadata)}` : output',
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
                assertion,
                test: {},
                providerResponse: { output, metadata },
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Assertion passed',
            });
        });
        it('should handle transform when metadata is undefined', async () => {
            const output = 'Test output';
            const assertion = {
                type: 'equals',
                value: 'No metadata',
                transform: 'context.metadata ? "Has metadata" : "No metadata"',
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
                assertion,
                test: {},
                providerResponse: { output },
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Assertion passed',
            });
        });
        it('should handle transform when providerResponse has no metadata', async () => {
            const output = 'Test output';
            const assertion = {
                type: 'equals',
                value: 'No metadata',
                transform: 'context.metadata ? "Has metadata" : "No metadata"',
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
                assertion,
                test: {},
                providerResponse: { output }, // No metadata property
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Assertion passed',
            });
        });
        it('should handle empty metadata object', async () => {
            const output = 'Test output';
            const metadata = {};
            const assertion = {
                type: 'equals',
                value: 'Empty metadata',
                transform: '(context.metadata && Object.keys(context.metadata).length === 0) ? "Empty metadata" : output',
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
                assertion,
                test: {},
                providerResponse: { output, metadata },
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Assertion passed',
            });
        });
        it('should preserve existing context properties when adding metadata', async () => {
            const output = 'Test output';
            const metadata = { responseTime: 100 };
            const testVars = { userInput: 'test input' };
            const assertion = {
                type: 'equals',
                value: 'All context properties present',
                transform: '(context.vars && context.prompt && context.metadata) ? "All context properties present" : "Missing context properties"',
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'test prompt',
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
                assertion,
                test: { vars: testVars },
                providerResponse: { output, metadata },
            });
            expect(result).toMatchObject({
                pass: true,
                reason: 'Assertion passed',
            });
        });
    });
    describe('file references', () => {
        it('should handle file reference in string value', async () => {
            const assertion = {
                type: 'equals',
                value: 'file://expected_output.txt',
            };
            const expectedContent = 'Expected output';
            jest.mocked(fs.readFileSync).mockReturnValue(expectedContent);
            jest.mocked(path.resolve).mockReturnValue('/base/path/expected_output.txt');
            jest.mocked(path.extname).mockReturnValue('.txt');
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
                assertion,
                test: {},
                providerResponse: { output: 'Expected output' },
            });
            expect(fs.readFileSync).toHaveBeenCalledWith('/base/path/expected_output.txt', 'utf8');
            expect(result.pass).toBe(true);
        });
        it('should handle file references in array values', async () => {
            const assertion = {
                type: 'contains-any',
                value: ['The expected output', 'string output', 'file://my_expected_output.txt'],
            };
            const fileContent = 'file content';
            jest.mocked(fs.readFileSync).mockReturnValue(fileContent);
            jest.mocked(path.resolve).mockReturnValue('/base/path/my_expected_output.txt');
            jest.mocked(path.extname).mockReturnValue('.txt');
            await expect((0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
                assertion,
                test: {},
                providerResponse: { output: 'file content' },
            })).resolves.toEqual(expect.objectContaining({
                pass: true,
            }));
            expect(fs.readFileSync).toHaveBeenCalledWith('/base/path/my_expected_output.txt', 'utf8');
            await expect((0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
                assertion,
                test: {},
                providerResponse: { output: 'string output' },
            })).resolves.toEqual(expect.objectContaining({
                pass: true,
            }));
        });
        it('should handle file reference in object value', async () => {
            const assertion = {
                type: 'is-json',
                value: 'file://schema.json',
            };
            const schemaContent = JSON.stringify({
                type: 'object',
                properties: {
                    key: { type: 'string' },
                },
            });
            jest.mocked(fs.readFileSync).mockReturnValue(schemaContent);
            jest.mocked(path.resolve).mockReturnValue('/base/path/schema.json');
            jest.mocked(path.extname).mockReturnValue('.json');
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
                assertion,
                test: {},
                providerResponse: { output: '{"key": "value"}' },
            });
            expect(fs.readFileSync).toHaveBeenCalledWith('/base/path/schema.json', 'utf8');
            expect(result.pass).toBe(true);
        });
    });
    describe('Rendered assertion values', () => {
        it('should store rendered assertion value in metadata when variables are substituted', async () => {
            const assertion = {
                type: 'contains',
                value: 'User said: {{ user_input }}',
            };
            const test = {
                vars: {
                    user_input: 'hello world',
                },
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                assertion,
                test,
                providerResponse: { output: 'User said: hello world' },
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            });
            expect(result.metadata?.renderedAssertionValue).toBe('User said: hello world');
            expect(result.assertion?.value).toBe('User said: {{ user_input }}');
        });
        it('should store rendered assertion value with loops', async () => {
            const assertion = {
                type: 'contains',
                value: '{% for item in items %}{{ item.name }}{% if not loop.last %}, {% endif %}{% endfor %}',
            };
            const test = {
                vars: {
                    items: [{ name: 'apple' }, { name: 'banana' }, { name: 'cherry' }],
                },
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                assertion,
                test,
                providerResponse: { output: 'apple, banana, cherry' },
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            });
            expect(result.metadata?.renderedAssertionValue).toBe('apple, banana, cherry');
        });
        it('should not store rendered value when template equals original', async () => {
            const assertion = {
                type: 'contains',
                value: 'Static text without variables',
            };
            const test = {
                vars: {
                    user_input: 'hello',
                },
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                assertion,
                test,
                providerResponse: { output: 'Static text without variables' },
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            });
            expect(result.metadata?.renderedAssertionValue).toBeUndefined();
        });
        it('should store rendered value for complex template matching GitHub issue example', async () => {
            const assertion = {
                type: 'contains',
                value: `Did {{ agent_name }} select the expected tools across the conversation?

{% for turn in turns %}
{% if turn.expected_tool %}Turn {{ loop.index }}: Expected tool "{{ turn.expected_tool }}"
{% endif %}
{% endfor %}`,
            };
            const test = {
                vars: {
                    agent_name: 'Virtual Assistant',
                    turns: [
                        { expected_tool: 'preview_create' },
                        { expected_tool: 'preview_create' },
                        { expected_tool: 'execute_create' },
                    ],
                },
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                assertion,
                test,
                providerResponse: { output: 'some output' },
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            });
            expect(result.metadata?.renderedAssertionValue).toContain('Virtual Assistant');
            expect(result.metadata?.renderedAssertionValue).toContain('Turn 1: Expected tool "preview_create"');
            expect(result.metadata?.renderedAssertionValue).toContain('Turn 2: Expected tool "preview_create"');
            expect(result.metadata?.renderedAssertionValue).toContain('Turn 3: Expected tool "execute_create"');
        });
        it('should store rendered value for javascript assertions', async () => {
            const assertion = {
                type: 'javascript',
                value: "output.includes('{{ expected_value }}')",
            };
            const test = {
                vars: {
                    expected_value: 'hello',
                },
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                assertion,
                test,
                providerResponse: { output: 'hello world' },
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            });
            expect(result.metadata?.renderedAssertionValue).toBe("output.includes('hello')");
        });
        it('should store rendered value even when assertion fails', async () => {
            const assertion = {
                type: 'contains',
                value: 'Expected: {{ value }}',
            };
            const test = {
                vars: {
                    value: 'foo',
                },
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                assertion,
                test,
                providerResponse: { output: 'Different output - no match' },
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            });
            // Assertion should fail (output doesn't contain "Expected: foo")
            expect(result.pass).toBe(false);
            // But rendered value should still be captured in metadata
            expect(result.metadata?.renderedAssertionValue).toBe('Expected: foo');
            // Original template should remain in assertion
            expect(result.assertion?.value).toBe('Expected: {{ value }}');
        });
        it('should preserve existing metadata when adding renderedAssertionValue', async () => {
            const assertion = {
                type: 'contains',
                value: 'User: {{ name }}',
            };
            const test = {
                vars: {
                    name: 'Alice',
                },
            };
            const result = await (0, index_1.runAssertion)({
                prompt: 'Some prompt',
                assertion,
                test,
                providerResponse: { output: 'User: Alice' },
                provider: new chat_1.OpenAiChatCompletionProvider('gpt-4o-mini'),
            });
            // Should have rendered value
            expect(result.metadata?.renderedAssertionValue).toBe('User: Alice');
            // Original template in assertion
            expect(result.assertion?.value).toBe('User: {{ name }}');
            // Metadata object should exist and be extensible
            expect(result.metadata).toBeTruthy();
        });
    });
});
//# sourceMappingURL=runAssertion.test.js.map