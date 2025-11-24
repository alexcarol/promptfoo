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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const dedent_1 = __importDefault(require("dedent"));
const glob_1 = require("glob");
const js_yaml_1 = __importDefault(require("js-yaml"));
const csv_1 = require("../../src/csv");
const envars_1 = require("../../src/envars");
const googleSheets_1 = require("../../src/googleSheets");
const huggingfaceDatasets_1 = require("../../src/integrations/huggingfaceDatasets");
const logger_1 = __importDefault(require("../../src/logger"));
const index_1 = require("../../src/providers/index");
const pythonUtils_1 = require("../../src/python/pythonUtils");
const file_1 = require("../../src/util/file");
const testCaseReader_1 = require("../../src/util/testCaseReader");
// Mock fetchWithTimeout before any imports that might use telemetry
jest.mock('../../src/util/fetch', () => ({
    fetchWithTimeout: jest.fn().mockResolvedValue({ ok: true }),
}));
jest.mock('proxy-agent', () => ({
    ProxyAgent: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('glob', () => ({
    globSync: jest.fn(),
    hasMagic: jest.fn((pattern) => {
        const p = Array.isArray(pattern) ? pattern.join('') : pattern;
        return p.includes('*') || p.includes('?') || p.includes('[') || p.includes('{');
    }),
}));
jest.mock('../../src/providers', () => ({
    loadApiProvider: jest.fn(),
}));
jest.mock('../../src/util/fetch/index.ts');
jest.mock('fs', () => ({
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    statSync: jest.fn(),
    readdirSync: jest.fn(),
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    promises: {
        readFile: jest.fn(),
    },
}));
jest.mock('../../src/database', () => ({
    getDb: jest.fn(),
}));
jest.mock('../../src/googleSheets', () => ({
    fetchCsvFromGoogleSheet: jest.fn(),
}));
jest.mock('../../src/envars', () => ({
    ...jest.requireActual('../../src/envars'),
    getEnvBool: jest.fn(),
    getEnvString: jest.fn(),
}));
jest.mock('../../src/python/pythonUtils', () => ({
    runPython: jest.fn(),
}));
jest.mock('../../src/integrations/huggingfaceDatasets', () => ({
    fetchHuggingFaceDataset: jest.fn(),
}));
jest.mock('../../src/telemetry', () => {
    const mockTelemetry = {
        record: jest.fn().mockResolvedValue(undefined),
        identify: jest.fn(),
        saveConsent: jest.fn().mockResolvedValue(undefined),
        disabled: false,
    };
    return {
        __esModule: true,
        default: mockTelemetry,
        Telemetry: jest.fn().mockImplementation(() => mockTelemetry),
    };
});
jest.mock('../../src/esm', () => ({
    importModule: jest.fn(),
}));
jest.mock('../../src/util/file', () => ({
    maybeLoadConfigFromExternalFile: jest.fn((config) => {
        // Mock implementation that handles file:// references
        // Handle arrays first to preserve their type
        if (Array.isArray(config)) {
            return config.map((item) => {
                const mockFn = jest.requireMock('../../src/util/file').maybeLoadConfigFromExternalFile;
                return mockFn(item);
            });
        }
        // Handle objects (but not arrays)
        if (config && typeof config === 'object' && config !== null) {
            const result = { ...config };
            for (const [key, value] of Object.entries(config)) {
                if (typeof value === 'string' && value.startsWith('file://')) {
                    // Extract the file path from the file:// URL
                    const filePath = value.slice('file://'.length);
                    // Get the mocked file content using the extracted path
                    const fs = jest.requireMock('fs');
                    const fileContent = fs.readFileSync(filePath, 'utf-8');
                    if (typeof fileContent === 'string') {
                        try {
                            result[key] = JSON.parse(fileContent);
                        }
                        catch {
                            result[key] = fileContent;
                        }
                    }
                }
            }
            return result;
        }
        return config;
    }),
}));
jest.mock('xlsx', () => ({
    readFile: jest.fn(),
    utils: { sheet_to_json: jest.fn() },
}));
// Helper to clear all mocks
const clearAllMocks = () => {
    jest.clearAllMocks();
    jest.mocked(glob_1.globSync).mockReset();
    jest.mocked(fs.readFileSync).mockReset();
    jest.mocked(envars_1.getEnvBool).mockReset();
    jest.mocked(envars_1.getEnvString).mockReset();
    jest.mocked(googleSheets_1.fetchCsvFromGoogleSheet).mockReset();
    jest.mocked(index_1.loadApiProvider).mockReset();
    jest.mocked(pythonUtils_1.runPython).mockReset();
    jest.mocked(huggingfaceDatasets_1.fetchHuggingFaceDataset).mockReset();
    jest.mocked(file_1.maybeLoadConfigFromExternalFile).mockReset();
    const mockImportModule = jest.requireMock('../../src/esm').importModule;
    mockImportModule.mockReset();
};
describe('readStandaloneTestsFile', () => {
    beforeEach(() => {
        clearAllMocks();
        // Reset getEnvString to default behavior
        jest.mocked(envars_1.getEnvString).mockImplementation((_key, defaultValue) => defaultValue || '');
        // Restore maybeLoadConfigFromExternalFile mock
        jest.mocked(file_1.maybeLoadConfigFromExternalFile).mockImplementation((config) => {
            // Handle arrays first to preserve their type
            if (Array.isArray(config)) {
                return config.map((item) => {
                    const mockFn = jest.requireMock('../../src/util/file').maybeLoadConfigFromExternalFile;
                    return mockFn(item);
                });
            }
            // Mock implementation that handles file:// references
            if (config && typeof config === 'object' && config !== null) {
                const result = { ...config };
                for (const [key, value] of Object.entries(config)) {
                    if (typeof value === 'string' && value.startsWith('file://')) {
                        // Extract the file path from the file:// URL
                        const filePath = value.slice('file://'.length);
                        // Get the mocked file content using the extracted path
                        const fs = jest.requireMock('fs');
                        const fileContent = fs.readFileSync(filePath, 'utf-8');
                        if (typeof fileContent === 'string') {
                            try {
                                result[key] = JSON.parse(fileContent);
                            }
                            catch {
                                result[key] = fileContent;
                            }
                        }
                    }
                }
                return result;
            }
            return config;
        });
    });
    afterEach(() => {
        clearAllMocks();
    });
    it('should read CSV file and return test cases', async () => {
        jest
            .mocked(fs.readFileSync)
            .mockReturnValue('var1,var2,__expected\nvalue1,value2,expected1\nvalue3,value4,expected2');
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test.csv');
        expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('test.csv'), 'utf-8');
        expect(result).toEqual([
            {
                assert: [{ metric: undefined, type: 'equals', value: 'expected1' }],
                description: 'Row #1',
                options: {},
                vars: { var1: 'value1', var2: 'value2' },
            },
            {
                assert: [{ metric: undefined, type: 'equals', value: 'expected2' }],
                description: 'Row #2',
                options: {},
                vars: { var1: 'value3', var2: 'value4' },
            },
        ]);
    });
    it('should read CSV file with BOM (Byte Order Mark) and return test cases', async () => {
        jest
            .mocked(fs.readFileSync)
            .mockReturnValue('\uFEFFvar1,var2,__expected\nvalue1,value2,expected1\nvalue3,value4,expected2');
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test.csv');
        expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('test.csv'), 'utf-8');
        expect(result).toEqual([
            {
                assert: [{ metric: undefined, type: 'equals', value: 'expected1' }],
                description: 'Row #1',
                options: {},
                vars: { var1: 'value1', var2: 'value2' },
            },
            {
                assert: [{ metric: undefined, type: 'equals', value: 'expected2' }],
                description: 'Row #2',
                options: {},
                vars: { var1: 'value3', var2: 'value4' },
            },
        ]);
    });
    it('should read JSON file and return test cases', async () => {
        jest.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([
            {
                vars: { var1: 'value1', var2: 'value2' },
                assert: [{ type: 'equals', value: 'expected1' }],
                description: 'Test #1',
            },
            {
                vars: { var1: 'value3', var2: 'value4' },
                assert: [{ type: 'contains', value: 'expected2' }],
                description: 'Test #2',
            },
        ]));
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test.json');
        expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('test.json'), 'utf-8');
        expect(result).toEqual([
            {
                vars: { var1: 'value1', var2: 'value2' },
                assert: [{ type: 'equals', value: 'expected1' }],
                description: 'Test #1',
            },
            {
                vars: { var1: 'value3', var2: 'value4' },
                assert: [{ type: 'contains', value: 'expected2' }],
                description: 'Test #2',
            },
        ]);
    });
    it('should read JSONL file and return test cases', async () => {
        jest.mocked(fs.readFileSync).mockReturnValue(`{"vars":{"var1":"value1","var2":"value2"},"assert":[{"type":"equals","value":"Hello World"}]}
        {"vars":{"var1":"value3","var2":"value4"},"assert":[{"type":"equals","value":"Hello World"}]}`);
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test.jsonl');
        expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('test.jsonl'), 'utf-8');
        expect(result).toEqual([
            {
                assert: [{ type: 'equals', value: 'Hello World' }],
                description: 'Row #1',
                vars: { var1: 'value1', var2: 'value2' },
            },
            {
                assert: [{ type: 'equals', value: 'Hello World' }],
                description: 'Row #2',
                vars: { var1: 'value3', var2: 'value4' },
            },
        ]);
    });
    it('should read YAML file and return test cases', async () => {
        jest.mocked(fs.readFileSync).mockReturnValue((0, dedent_1.default) `
      - var1: value1
        var2: value2
      - var1: value3
        var2: value4
    `);
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test.yaml');
        expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('test.yaml'), 'utf-8');
        expect(result).toEqual([
            { assert: [], description: 'Row #1', options: {}, vars: { var1: 'value1', var2: 'value2' } },
            { assert: [], description: 'Row #2', options: {}, vars: { var1: 'value3', var2: 'value4' } },
        ]);
    });
    it('should read Google Sheets and return test cases', async () => {
        const mockFetchCsvFromGoogleSheet = jest.mocked(googleSheets_1.fetchCsvFromGoogleSheet);
        mockFetchCsvFromGoogleSheet.mockResolvedValue([
            { var1: 'value1', var2: 'value2', __expected: 'expected1' },
            { var1: 'value3', var2: 'value4', __expected: 'expected2' },
        ]);
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('https://docs.google.com/spreadsheets/d/example');
        expect(mockFetchCsvFromGoogleSheet).toHaveBeenCalledWith('https://docs.google.com/spreadsheets/d/example');
        expect(result).toEqual([
            {
                assert: [{ metric: undefined, type: 'equals', value: 'expected1' }],
                description: 'Row #1',
                options: {},
                vars: { var1: 'value1', var2: 'value2' },
            },
            {
                assert: [{ metric: undefined, type: 'equals', value: 'expected2' }],
                description: 'Row #2',
                options: {},
                vars: { var1: 'value3', var2: 'value4' },
            },
        ]);
    });
    it('should read JS file and return test cases', async () => {
        const mockTestCases = [
            { vars: { var1: 'value1', var2: 'value2' } },
            { vars: { var1: 'value3', var2: 'value4' } },
        ];
        jest.mocked(jest.requireMock('../../src/esm').importModule).mockResolvedValue(mockTestCases);
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test.js');
        expect(jest.requireMock('../../src/esm').importModule).toHaveBeenCalledWith(expect.stringContaining('test.js'), undefined);
        expect(result).toEqual(mockTestCases);
    });
    it('should pass config to JS test generator function', async () => {
        const mockFn = jest.fn().mockResolvedValue([{ vars: { a: 1 } }]);
        jest.mocked(jest.requireMock('../../src/esm').importModule).mockResolvedValue(mockFn);
        const config = { foo: 'bar' };
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test_gen.js', '', config);
        expect(jest.requireMock('../../src/esm').importModule).toHaveBeenCalledWith(expect.stringContaining('test_gen.js'), undefined);
        expect(mockFn).toHaveBeenCalledWith(config);
        expect(result).toEqual([{ vars: { a: 1 } }]);
    });
    it('should load file references in config for JS generator', async () => {
        const mockResult = [{ vars: { a: 1 } }];
        const mockFn = jest.fn().mockResolvedValue(mockResult);
        jest.mocked(jest.requireMock('../../src/esm').importModule).mockResolvedValue(mockFn);
        jest.mocked(fs.existsSync).mockReturnValueOnce(true);
        jest.mocked(fs.readFileSync).mockReturnValueOnce('{"foo": "bar"}');
        const config = { data: 'file://config.json' };
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test_config_gen.js', '', config);
        expect(jest.requireMock('../../src/esm').importModule).toHaveBeenCalledWith(expect.stringContaining('test_config_gen.js'), undefined);
        expect(mockFn).toHaveBeenCalledWith({ data: { foo: 'bar' } });
        expect(result).toEqual(mockResult);
    });
    it('should handle file:// prefix in file path', async () => {
        jest.mocked(fs.readFileSync).mockReturnValue('var1,var2\nvalue1,value2');
        await (0, testCaseReader_1.readStandaloneTestsFile)('file://test.csv');
        expect(fs.readFileSync).toHaveBeenCalledWith(expect.not.stringContaining('file://'), 'utf-8');
    });
    it('should return an empty array for unsupported file types', async () => {
        await expect((0, testCaseReader_1.readStandaloneTestsFile)('test.txt')).resolves.toEqual([]);
    });
    it('should read CSV file with default delimiter', async () => {
        jest.mocked(envars_1.getEnvString).mockReturnValue(',');
        jest
            .mocked(fs.readFileSync)
            .mockReturnValue('var1,var2,__expected\nvalue1,value2,expected1\nvalue3,value4,expected2');
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test.csv');
        expect(envars_1.getEnvString).toHaveBeenCalledWith('PROMPTFOO_CSV_DELIMITER', ',');
        expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('test.csv'), 'utf-8');
        expect(result).toEqual([
            {
                assert: [{ metric: undefined, type: 'equals', value: 'expected1' }],
                description: 'Row #1',
                options: {},
                vars: { var1: 'value1', var2: 'value2' },
            },
            {
                assert: [{ metric: undefined, type: 'equals', value: 'expected2' }],
                description: 'Row #2',
                options: {},
                vars: { var1: 'value3', var2: 'value4' },
            },
        ]);
    });
    it('should read CSV file with custom delimiter', async () => {
        jest.mocked(envars_1.getEnvString).mockReturnValue(';');
        jest
            .mocked(fs.readFileSync)
            .mockReturnValue('var1;var2;__expected\nvalue1;value2;expected1\nvalue3;value4;expected2');
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test.csv');
        expect(envars_1.getEnvString).toHaveBeenCalledWith('PROMPTFOO_CSV_DELIMITER', ',');
        expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('test.csv'), 'utf-8');
        expect(result).toEqual([
            {
                assert: [{ metric: undefined, type: 'equals', value: 'expected1' }],
                description: 'Row #1',
                options: {},
                vars: { var1: 'value1', var2: 'value2' },
            },
            {
                assert: [{ metric: undefined, type: 'equals', value: 'expected2' }],
                description: 'Row #2',
                options: {},
                vars: { var1: 'value3', var2: 'value4' },
            },
        ]);
    });
    it('should read XLSX file and return test cases', async () => {
        const sheetData = [
            { var1: 'value1', var2: 'value2', __expected: 'expected1' },
            { var1: 'value3', var2: 'value4', __expected: 'expected2' },
        ];
        // Mock fs.existsSync to return true for our test file
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        // Mock the dynamic import
        jest.doMock('xlsx', () => ({
            readFile: jest.fn().mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } }),
            utils: { sheet_to_json: jest.fn().mockReturnValue(sheetData) },
        }));
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test.xlsx');
        const xlsx = await Promise.resolve().then(() => __importStar(require('xlsx')));
        expect(xlsx.readFile).toHaveBeenCalledWith(expect.stringContaining('test.xlsx'));
        expect(result).toEqual([
            {
                assert: [{ metric: undefined, type: 'equals', value: 'expected1' }],
                description: 'Row #1',
                options: {},
                vars: { var1: 'value1', var2: 'value2' },
            },
            {
                assert: [{ metric: undefined, type: 'equals', value: 'expected2' }],
                description: 'Row #2',
                options: {},
                vars: { var1: 'value3', var2: 'value4' },
            },
        ]);
        // Clean up the mock
        jest.dontMock('xlsx');
    });
    it('should throw helpful error when xlsx module is not installed', async () => {
        // Create a test that validates the error message is properly formatted
        // when the xlsx module cannot be found
        const mockError = new Error("Cannot find module 'xlsx'");
        // Mock fs.readFileSync to avoid actual file read
        jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('mock content'));
        // Create a new instance with mocked xlsx module
        jest.doMock('xlsx', () => {
            throw mockError;
        });
        // Clear module cache to ensure fresh import
        jest.resetModules();
        try {
            // Import the module which will attempt to import xlsx
            const { parseXlsxFile } = await Promise.resolve().then(() => __importStar(require('../../src/util/xlsx')));
            // Attempt to parse a file, which should trigger the error
            await expect(parseXlsxFile('test.xlsx')).rejects.toThrow('xlsx is not installed. Please install it with: npm install xlsx\n' +
                'Note: xlsx is an optional peer dependency for reading Excel files.');
        }
        finally {
            // Clean up
            jest.dontMock('xlsx');
            jest.resetModules();
        }
    });
    it('should throw error when Excel file has no sheets', async () => {
        const mockXlsx = {
            readFile: jest.fn().mockReturnValue({
                SheetNames: [],
                Sheets: {},
            }),
            utils: { sheet_to_json: jest.fn() },
        };
        // Mock fs module to survive resetModules
        jest.doMock('fs', () => ({
            ...jest.requireActual('fs'),
            existsSync: jest.fn().mockReturnValue(true),
        }));
        jest.doMock('xlsx', () => mockXlsx);
        jest.resetModules();
        try {
            const { parseXlsxFile } = await Promise.resolve().then(() => __importStar(require('../../src/util/xlsx')));
            await expect(parseXlsxFile('empty.xlsx')).rejects.toThrow('Excel file has no sheets');
        }
        finally {
            jest.dontMock('xlsx');
            jest.dontMock('fs');
            jest.resetModules();
        }
    });
    it('should read real XLSX file from examples (integration test)', async () => {
        // Integration test using the actual Excel file from examples
        const path = require('path');
        const exampleFile = path.join(__dirname, '../../examples/simple-csv/tests.xlsx');
        // Only run if xlsx is actually installed (in dev environment)
        try {
            await Promise.resolve().then(() => __importStar(require('xlsx')));
            const fs = require('fs');
            if (fs.existsSync(exampleFile)) {
                const result = await (0, testCaseReader_1.readStandaloneTestsFile)(exampleFile);
                // Verify the structure matches expected test cases
                expect(result).toHaveLength(4); // Based on the known test data
                expect(result[0]).toMatchObject({
                    vars: expect.objectContaining({
                        language: expect.any(String),
                        body: expect.any(String),
                    }),
                    assert: expect.any(Array),
                });
                // Verify specific test case content
                const frenchTest = result.find((test) => test.vars?.language === 'French');
                expect(frenchTest).toBeDefined();
                expect(frenchTest?.vars?.body).toBe('Hello world');
            }
            else {
                console.log('Skipping integration test - example Excel file not found');
            }
        }
        catch (error) {
            // Skip test if xlsx is not installed
            console.log('Skipping integration test - xlsx not available:', error);
        }
    });
    it('should handle Python files with default function name', async () => {
        const pythonResult = [
            { vars: { var1: 'value1' }, assert: [{ type: 'equals', value: 'expected1' }] },
            { vars: { var2: 'value2' }, assert: [{ type: 'equals', value: 'expected2' }] },
        ];
        jest.mocked(pythonUtils_1.runPython).mockResolvedValue(pythonResult);
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test.py');
        expect(pythonUtils_1.runPython).toHaveBeenCalledWith(expect.stringContaining('test.py'), 'generate_tests', []);
        expect(result).toEqual(pythonResult);
    });
    it('should handle Python files with custom function name', async () => {
        const pythonResult = [
            { vars: { var1: 'value1' }, assert: [{ type: 'equals', value: 'expected1' }] },
        ];
        jest.mocked(pythonUtils_1.runPython).mockResolvedValue(pythonResult);
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test.py:custom_function');
        expect(pythonUtils_1.runPython).toHaveBeenCalledWith(expect.stringContaining('test.py'), 'custom_function', []);
        expect(result).toEqual(pythonResult);
    });
    it('should pass config to Python generate_tests function', async () => {
        const pythonResult = [{ vars: { a: 1 }, assert: [] }];
        jest.mocked(pythonUtils_1.runPython).mockResolvedValue(pythonResult);
        const config = { dataset: 'demo' };
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test.py', '', config);
        expect(pythonUtils_1.runPython).toHaveBeenCalledWith(expect.stringContaining('test.py'), 'generate_tests', [
            config,
        ]);
        expect(result).toEqual(pythonResult);
    });
    it('should load file references in config for Python generator', async () => {
        const pythonResult = [{ vars: { a: 1 }, assert: [] }];
        jest.mocked(pythonUtils_1.runPython).mockResolvedValue(pythonResult);
        // Mock maybeLoadConfigFromExternalFile to transform file:// references
        jest.mocked(file_1.maybeLoadConfigFromExternalFile).mockImplementation((config) => {
            // Handle arrays first to preserve their type
            if (Array.isArray(config)) {
                return config.map((item) => {
                    const mockFn = jest.requireMock('../../src/util/file').maybeLoadConfigFromExternalFile;
                    return mockFn(item);
                });
            }
            if (config && typeof config === 'object' && config !== null) {
                const result = { ...config };
                for (const [key, value] of Object.entries(config)) {
                    if (typeof value === 'string' && value.startsWith('file://')) {
                        result[key] = { foo: 'bar' }; // Return the expected transformed value
                    }
                }
                return result;
            }
            return config;
        });
        jest.mocked(fs.existsSync).mockReturnValue(true);
        jest.mocked(fs.readFileSync).mockImplementation((path) => {
            if (path.toString().includes('config.json')) {
                return '{"foo": "bar"}';
            }
            return '';
        });
        const config = { data: 'file://config.json' };
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test.py', '', config);
        expect(pythonUtils_1.runPython).toHaveBeenCalledWith(expect.stringContaining('test.py'), 'generate_tests', [
            { data: { foo: 'bar' } },
        ]);
        expect(result).toEqual(pythonResult);
    });
    it('should throw error when Python file returns non-array', async () => {
        jest.mocked(pythonUtils_1.runPython).mockResolvedValue({ not: 'an array' });
        await expect((0, testCaseReader_1.readStandaloneTestsFile)('test.py')).rejects.toThrow('Python test function must return a list of test cases, got object');
    });
    it('should handle Python files with invalid function name in readStandaloneTestsFile', async () => {
        await expect((0, testCaseReader_1.readStandaloneTestsFile)('test.py:invalid:extra')).rejects.toThrow('Too many colons. Invalid test file script path: test.py:invalid:extra');
    });
    it('should read JSON file with a single test case object', async () => {
        jest.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
            vars: { var1: 'value1', var2: 'value2' },
            assert: [{ type: 'equals', value: 'expected1' }],
            description: 'Single Test',
        }));
        const result = await (0, testCaseReader_1.readStandaloneTestsFile)('test.json');
        expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('test.json'), 'utf-8');
        expect(result).toEqual([
            {
                vars: { var1: 'value1', var2: 'value2' },
                assert: [{ type: 'equals', value: 'expected1' }],
                description: 'Single Test',
            },
        ]);
    });
});
describe('readTest', () => {
    beforeEach(() => {
        clearAllMocks();
        // Restore maybeLoadConfigFromExternalFile mock
        jest.mocked(file_1.maybeLoadConfigFromExternalFile).mockImplementation((config) => {
            // Handle arrays first to preserve their type
            if (Array.isArray(config)) {
                return config.map((item) => {
                    const mockFn = jest.requireMock('../../src/util/file').maybeLoadConfigFromExternalFile;
                    return mockFn(item);
                });
            }
            // Mock implementation that handles file:// references
            if (config && typeof config === 'object' && config !== null) {
                const result = { ...config };
                for (const [key, value] of Object.entries(config)) {
                    if (typeof value === 'string' && value.startsWith('file://')) {
                        // Extract the file path from the file:// URL
                        const filePath = value.slice('file://'.length);
                        // Get the mocked file content using the extracted path
                        const fs = jest.requireMock('fs');
                        const fileContent = fs.readFileSync(filePath, 'utf-8');
                        if (typeof fileContent === 'string') {
                            try {
                                result[key] = JSON.parse(fileContent);
                            }
                            catch {
                                result[key] = fileContent;
                            }
                        }
                    }
                }
                return result;
            }
            return config;
        });
    });
    afterEach(() => {
        clearAllMocks();
    });
    it('readTest with string input (path to test config)', async () => {
        const testPath = 'test1.yaml';
        const testContent = {
            description: 'Test 1',
            vars: { var1: 'value1', var2: 'value2' },
            assert: [{ type: 'equals', value: 'value1' }],
        };
        jest.mocked(fs.readFileSync).mockReturnValueOnce(js_yaml_1.default.dump(testContent));
        const result = await (0, testCaseReader_1.readTest)(testPath);
        expect(fs.readFileSync).toHaveBeenCalledTimes(1);
        expect(result).toEqual(testContent);
    });
    it('readTest with TestCase input', async () => {
        const input = {
            description: 'Test 1',
            vars: { var1: 'value1', var2: 'value2' },
            assert: [{ type: 'equals', value: 'value1' }],
        };
        const result = await (0, testCaseReader_1.readTest)(input);
        expect(result).toEqual(input);
    });
    it('readTest with invalid input', async () => {
        const input = 123;
        await expect((0, testCaseReader_1.readTest)(input)).rejects.toThrow('Test case must contain one of the following properties: assert, vars, options, metadata, provider, providerOutput, threshold.\n\nInstead got:\n{}');
    });
    it('readTest with TestCase that contains a vars glob input', async () => {
        const input = {
            description: 'Test 1',
            vars: 'vars/*.yaml',
            assert: [{ type: 'equals', value: 'value1' }],
        };
        const varsContent1 = { var1: 'value1' };
        const varsContent2 = { var2: 'value2' };
        jest.mocked(glob_1.globSync).mockReturnValueOnce(['vars/vars1.yaml', 'vars/vars2.yaml']);
        jest
            .mocked(fs.readFileSync)
            .mockReturnValueOnce(js_yaml_1.default.dump(varsContent1))
            .mockReturnValueOnce(js_yaml_1.default.dump(varsContent2));
        const result = await (0, testCaseReader_1.readTest)(input);
        expect(glob_1.globSync).toHaveBeenCalledTimes(1);
        expect(fs.readFileSync).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
            description: 'Test 1',
            vars: { var1: 'value1', var2: 'value2' },
            assert: [{ type: 'equals', value: 'value1' }],
        });
    });
    describe('readTest with provider', () => {
        it('should load provider when provider is a string', async () => {
            const mockProvider = { callApi: jest.fn(), id: jest.fn().mockReturnValue('mock-provider') };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockProvider);
            const testCase = {
                description: 'Test with string provider',
                provider: 'mock-provider',
                assert: [{ type: 'equals', value: 'expected' }],
            };
            const result = await (0, testCaseReader_1.readTest)(testCase);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('mock-provider');
            expect(result.provider).toBe(mockProvider);
        });
        it('should load provider when provider is an object with id', async () => {
            const mockProvider = { callApi: jest.fn(), id: jest.fn().mockReturnValue('mock-provider') };
            jest.mocked(index_1.loadApiProvider).mockResolvedValue(mockProvider);
            const testCase = {
                description: 'Test with provider object',
                provider: {
                    id: 'mock-provider',
                    callApi: jest.fn(),
                },
                assert: [{ type: 'equals', value: 'expected' }],
            };
            const result = await (0, testCaseReader_1.readTest)(testCase);
            expect(index_1.loadApiProvider).toHaveBeenCalledWith('mock-provider', {
                options: { id: 'mock-provider', callApi: expect.any(Function) },
                basePath: '',
            });
            expect(result.provider).toBe(mockProvider);
        });
    });
    it('should skip validation when isDefaultTest is true', async () => {
        const defaultTestInput = {
            options: {
                provider: {
                    embedding: {
                        id: 'bedrock:embeddings:amazon.titan-embed-text-v2:0',
                        config: {
                            region: 'us-east-1',
                        },
                    },
                },
            },
        };
        // This should not throw even though it doesn't have required properties
        const result = await (0, testCaseReader_1.readTest)(defaultTestInput, '', true);
        expect(result.options).toEqual(defaultTestInput.options);
        expect(result.vars).toBeUndefined();
    });
    it('should skip validation for defaultTest with model-graded eval provider', async () => {
        const defaultTestInput = {
            options: {
                provider: 'openai:gpt-4.1-mini-0613',
            },
        };
        // This should not throw even though it doesn't have required properties
        const result = await (0, testCaseReader_1.readTest)(defaultTestInput, '', true);
        expect(result.options?.provider).toBe('openai:gpt-4.1-mini-0613');
        expect(result.vars).toBeUndefined();
    });
    it('should skip validation for defaultTest with text provider configuration', async () => {
        const defaultTestInput = {
            options: {
                provider: {
                    text: {
                        id: 'openai:gpt-4',
                        config: {
                            temperature: 0.7,
                        },
                    },
                },
            },
        };
        // This should not throw even though it doesn't have required properties
        const result = await (0, testCaseReader_1.readTest)(defaultTestInput, '', true);
        expect(result.options?.provider).toBeDefined();
        expect(result.options?.provider).toEqual({
            text: {
                id: 'openai:gpt-4',
                config: {
                    temperature: 0.7,
                },
            },
        });
        expect(result.vars).toBeUndefined();
    });
    it('should skip validation for defaultTest with provider object configuration', async () => {
        const defaultTestInput = {
            options: {
                provider: {
                    id: 'anthropic:claude-3-opus',
                    config: {
                        temperature: 0.5,
                        max_tokens: 1000,
                    },
                },
            },
        };
        // This should not throw even though it doesn't have required properties
        const result = await (0, testCaseReader_1.readTest)(defaultTestInput, '', true);
        expect(result.options?.provider).toEqual({
            id: 'anthropic:claude-3-opus',
            config: {
                temperature: 0.5,
                max_tokens: 1000,
            },
        });
        expect(result.vars).toBeUndefined();
    });
    it('should throw when not a defaultTest and missing required properties', async () => {
        // Create a test input that truly has no valid properties after loadTestWithVars
        const invalidTestInput = {
            someInvalidProperty: 'invalid',
        }; // Cast to any to bypass type checking for invalid input
        await expect((0, testCaseReader_1.readTest)(invalidTestInput, '', false)).rejects.toThrow('Test case must contain one of the following properties');
    });
    it('should read test from file', async () => {
        const testPath = 'test1.yaml';
        const testContent = {
            description: 'Test 1',
            vars: { var1: 'value1', var2: 'value2' },
            assert: [{ type: 'equals', value: 'value1' }],
        };
        jest.mocked(fs.readFileSync).mockReturnValueOnce(js_yaml_1.default.dump(testContent));
        const result = await (0, testCaseReader_1.readTest)(testPath);
        expect(fs.readFileSync).toHaveBeenCalledTimes(1);
        expect(result).toEqual(testContent);
    });
});
describe('readTests', () => {
    beforeEach(() => {
        clearAllMocks();
        jest.mocked(glob_1.globSync).mockReturnValue([]);
        // Restore maybeLoadConfigFromExternalFile mock for readTests tests
        jest.mocked(file_1.maybeLoadConfigFromExternalFile).mockImplementation((config) => {
            // Handle arrays first to preserve their type
            if (Array.isArray(config)) {
                return config.map((item) => {
                    const mockFn = jest.requireMock('../../src/util/file').maybeLoadConfigFromExternalFile;
                    return mockFn(item);
                });
            }
            // Mock implementation that handles file:// references
            if (config && typeof config === 'object' && config !== null) {
                const result = { ...config };
                for (const [key, value] of Object.entries(config)) {
                    if (typeof value === 'string' && value.startsWith('file://')) {
                        // Extract the file path from the file:// URL
                        const filePath = value.slice('file://'.length);
                        // Get the mocked file content using the extracted path
                        const fs = jest.requireMock('fs');
                        const fileContent = fs.readFileSync(filePath, 'utf-8');
                        if (typeof fileContent === 'string') {
                            try {
                                result[key] = JSON.parse(fileContent);
                            }
                            catch {
                                result[key] = fileContent;
                            }
                        }
                    }
                }
                return result;
            }
            return config;
        });
    });
    afterEach(() => {
        clearAllMocks();
    });
    it('readTests with string input (CSV file path)', async () => {
        jest
            .mocked(fs.readFileSync)
            .mockReturnValue('var1,var2,__expected\nvalue1,value2,value1\nvalue3,value4,fn:value5');
        const testsPath = 'tests.csv';
        const result = await (0, testCaseReader_1.readTests)(testsPath);
        expect(fs.readFileSync).toHaveBeenCalledTimes(1);
        expect(result).toEqual([
            {
                description: 'Row #1',
                vars: { var1: 'value1', var2: 'value2' },
                assert: [{ type: 'equals', value: 'value1' }],
                options: {},
            },
            {
                description: 'Row #2',
                vars: { var1: 'value3', var2: 'value4' },
                assert: [{ type: 'javascript', value: 'value5' }],
                options: {},
            },
        ]);
    });
    it('readTests with string input (CSV file path with file:// prefix)', async () => {
        jest
            .mocked(fs.readFileSync)
            .mockReturnValue('var1,var2,__expected\nvalue1,value2,value1\nvalue3,value4,fn:value5');
        const testsPath = 'file://tests.csv';
        const result = await (0, testCaseReader_1.readTests)(testsPath);
        expect(fs.readFileSync).toHaveBeenCalledTimes(1);
        expect(result).toEqual([
            {
                description: 'Row #1',
                vars: { var1: 'value1', var2: 'value2' },
                assert: [{ type: 'equals', value: 'value1' }],
                options: {},
            },
            {
                description: 'Row #2',
                vars: { var1: 'value3', var2: 'value4' },
                assert: [{ type: 'javascript', value: 'value5' }],
                options: {},
            },
        ]);
    });
    it('readTests with multiple __expected in CSV', async () => {
        jest
            .mocked(fs.readFileSync)
            .mockReturnValue('var1,var2,__expected1,__expected2,__expected3\nvalue1,value2,value1,value1.2,value1.3\nvalue3,value4,fn:value5,fn:value5.2,fn:value5.3');
        const testsPath = 'tests.csv';
        const result = await (0, testCaseReader_1.readTests)(testsPath);
        expect(fs.readFileSync).toHaveBeenCalledTimes(1);
        expect(result).toEqual([
            {
                description: 'Row #1',
                vars: { var1: 'value1', var2: 'value2' },
                assert: [
                    { type: 'equals', value: 'value1' },
                    { type: 'equals', value: 'value1.2' },
                    { type: 'equals', value: 'value1.3' },
                ],
                options: {},
            },
            {
                description: 'Row #2',
                vars: { var1: 'value3', var2: 'value4' },
                assert: [
                    { type: 'javascript', value: 'value5' },
                    { type: 'javascript', value: 'value5.2' },
                    { type: 'javascript', value: 'value5.3' },
                ],
                options: {},
            },
        ]);
    });
    it('readTests with array input (TestCase[])', async () => {
        const input = [
            {
                description: 'Test 1',
                vars: { var1: 'value1', var2: 'value2' },
                assert: [{ type: 'equals', value: 'value1' }],
            },
            {
                description: 'Test 2',
                vars: { var1: 'value3', var2: 'value4' },
                assert: [{ type: 'contains-json', value: 'value3' }],
            },
        ];
        const result = await (0, testCaseReader_1.readTests)(input);
        expect(result).toEqual(input);
    });
    it('readTests with string array input (paths to test configs)', async () => {
        const testsPaths = ['test1.yaml', 'test2.yaml'];
        const test1Content = [
            {
                description: 'Test 1',
                vars: { var1: 'value1', var2: 'value2' },
                assert: [{ type: 'equals', value: 'value1' }],
            },
        ];
        const test2Content = [
            {
                description: 'Test 2',
                vars: { var1: 'value3', var2: 'value4' },
                assert: [{ type: 'contains-json', value: 'value3' }],
            },
        ];
        jest
            .mocked(fs.readFileSync)
            .mockReturnValueOnce(js_yaml_1.default.dump(test1Content))
            .mockReturnValueOnce(js_yaml_1.default.dump(test2Content));
        jest.mocked(glob_1.globSync).mockImplementation((pathOrGlob) => [pathOrGlob].flat());
        const result = await (0, testCaseReader_1.readTests)(testsPaths);
        expect(fs.readFileSync).toHaveBeenCalledTimes(2);
        expect(result).toEqual([...test1Content, ...test2Content]);
    });
    it('readTests with vars glob input (paths to vars configs)', async () => {
        const testsPaths = ['test1.yaml'];
        const test1Content = [
            {
                description: 'Test 1',
                vars: 'vars1.yaml',
                assert: [{ type: 'equals', value: 'value1' }],
            },
        ];
        const vars1Content = {
            var1: 'value1',
            var2: 'value2',
        };
        jest
            .mocked(fs.readFileSync)
            .mockReturnValueOnce(js_yaml_1.default.dump(test1Content))
            .mockReturnValueOnce(js_yaml_1.default.dump(vars1Content));
        jest.mocked(glob_1.globSync).mockImplementation((pathOrGlob) => [pathOrGlob].flat());
        const result = await (0, testCaseReader_1.readTests)(testsPaths);
        expect(fs.readFileSync).toHaveBeenCalledTimes(2);
        expect(result).toEqual([Object.assign({}, test1Content[0], { vars: vars1Content })]);
    });
    it('readTests with single TestCase content', async () => {
        const testsPaths = ['test1.yaml'];
        const test1Content = {
            description: 'Test 1',
            assert: [{ type: 'equals', value: 'value1' }],
        };
        jest.mocked(fs.readFileSync).mockReturnValueOnce(js_yaml_1.default.dump(test1Content));
        jest.mocked(glob_1.globSync).mockImplementation((pathOrGlob) => [pathOrGlob].flat());
        const result = await (0, testCaseReader_1.readTests)(testsPaths);
        expect(fs.readFileSync).toHaveBeenCalledTimes(1);
        expect(result).toEqual([test1Content]);
    });
    it('should read tests from a Google Sheets URL', async () => {
        jest.mocked(googleSheets_1.fetchCsvFromGoogleSheet).mockResolvedValue([
            { var1: 'value1', var2: 'value2', __expected: 'expected1' },
            { var1: 'value3', var2: 'value4', __expected: 'expected2' },
        ]);
        const result = await (0, testCaseReader_1.readTests)('https://docs.google.com/spreadsheets/d/example');
        expect(googleSheets_1.fetchCsvFromGoogleSheet).toHaveBeenCalledWith('https://docs.google.com/spreadsheets/d/example');
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
            description: 'Row #1',
            vars: { var1: 'value1', var2: 'value2' },
            assert: [{ type: 'equals', value: 'expected1' }],
        });
        expect(result[1]).toMatchObject({
            description: 'Row #2',
            vars: { var1: 'value3', var2: 'value4' },
            assert: [{ type: 'equals', value: 'expected2' }],
        });
    });
    it('should log a warning for unsupported test format', async () => {
        const unsupportedTests = { invalid: 'format' };
        await (0, testCaseReader_1.readTests)(unsupportedTests);
        expect(logger_1.default.warn).toHaveBeenCalledWith(expect.stringContaining("Warning: Unsupported 'tests' format in promptfooconfig.yaml."));
    });
    it('should not log a warning if tests is undefined', async () => {
        await (0, testCaseReader_1.readTests)(undefined);
        expect(logger_1.default.warn).not.toHaveBeenCalled();
    });
    it('should read tests from multiple Google Sheets URLs', async () => {
        jest.mocked(glob_1.globSync).mockReturnValueOnce([]);
        const mockFetchCsvFromGoogleSheet = jest.mocked(googleSheets_1.fetchCsvFromGoogleSheet);
        mockFetchCsvFromGoogleSheet
            .mockResolvedValueOnce([
            { var1: 'value1', var2: 'value2', __expected: 'expected1' },
            { var1: 'value3', var2: 'value4', __expected: 'expected2' },
        ])
            .mockResolvedValueOnce([
            { var1: 'value5', var2: 'value6', __expected: 'expected3' },
            { var1: 'value7', var2: 'value8', __expected: 'expected4' },
        ]);
        const result = await (0, testCaseReader_1.readTests)([
            'https://docs.google.com/spreadsheets/d/example1',
            'https://docs.google.com/spreadsheets/d/example2',
        ]);
        expect(mockFetchCsvFromGoogleSheet).toHaveBeenCalledTimes(2);
        expect(mockFetchCsvFromGoogleSheet).toHaveBeenCalledWith('https://docs.google.com/spreadsheets/d/example1');
        expect(mockFetchCsvFromGoogleSheet).toHaveBeenCalledWith('https://docs.google.com/spreadsheets/d/example2');
        expect(result).toHaveLength(4);
        expect(result[0]).toMatchObject({
            description: 'Row #1',
            vars: { var1: 'value1', var2: 'value2' },
            assert: [{ type: 'equals', value: 'expected1' }],
        });
        expect(result[2]).toMatchObject({
            description: 'Row #1',
            vars: { var1: 'value5', var2: 'value6' },
            assert: [{ type: 'equals', value: 'expected3' }],
        });
    });
    it('should handle HuggingFace dataset URLs', async () => {
        const mockDataset = [
            {
                description: 'Test 1',
                vars: { var1: 'value1' },
                assert: [{ type: 'equals', value: 'expected1' }],
                options: {},
            },
            {
                description: 'Test 2',
                vars: { var2: 'value2' },
                assert: [{ type: 'equals', value: 'expected2' }],
                options: {},
            },
        ];
        jest.mocked(huggingfaceDatasets_1.fetchHuggingFaceDataset).mockResolvedValue(mockDataset);
        const result = await (0, testCaseReader_1.loadTestsFromGlob)('huggingface://datasets/example/dataset');
        expect(huggingfaceDatasets_1.fetchHuggingFaceDataset).toHaveBeenCalledWith('huggingface://datasets/example/dataset');
        expect(result).toEqual(mockDataset);
    });
    it('should handle JSONL files', async () => {
        const expectedTests = [
            {
                description: 'Test 1',
                vars: { var1: 'value1' },
                assert: [{ type: 'equals', value: 'expected1' }],
                options: {},
            },
            {
                description: 'Test 2',
                vars: { var2: 'value2' },
                assert: [{ type: 'equals', value: 'expected2' }],
                options: {},
            },
        ];
        const jsonlContent = expectedTests.map((test) => JSON.stringify(test)).join('\n');
        jest.mocked(fs.readFileSync).mockReturnValueOnce(jsonlContent);
        jest.mocked(glob_1.globSync).mockImplementation((pathOrGlob) => [pathOrGlob].flat());
        const result = await (0, testCaseReader_1.readTests)(['test.jsonl']);
        expect(result).toEqual(expectedTests);
    });
    it('should handle file read errors gracefully', async () => {
        jest.mocked(fs.readFileSync).mockImplementation(() => {
            throw new Error('File read error');
        });
        jest.mocked(glob_1.globSync).mockImplementation((pathOrGlob) => [pathOrGlob].flat());
        await expect((0, testCaseReader_1.readTests)(['test.yaml'])).rejects.toThrow('File read error');
    });
    it('should handle Python files in readTests', async () => {
        const pythonTests = [
            {
                description: 'Python Test 1',
                vars: { var1: 'value1' },
                assert: [{ type: 'equals', value: 'expected1' }],
                options: {},
            },
            {
                description: 'Python Test 2',
                vars: { var2: 'value2' },
                assert: [{ type: 'equals', value: 'expected2' }],
                options: {},
            },
        ];
        jest.mocked(pythonUtils_1.runPython).mockResolvedValue(pythonTests);
        jest.mocked(glob_1.globSync).mockReturnValueOnce(['test.py']);
        const result = await (0, testCaseReader_1.readTests)(['test.py']);
        expect(pythonUtils_1.runPython).toHaveBeenCalledWith(expect.stringContaining('test.py'), 'generate_tests', []);
        expect(result).toHaveLength(2);
        expect(result).toEqual(pythonTests);
    });
    it('should handle Python files with custom function in readTests', async () => {
        const pythonTests = [
            {
                description: 'Python Test 1',
                vars: { var1: 'value1' },
                assert: [{ type: 'equals', value: 'expected1' }],
                options: {},
            },
        ];
        jest.mocked(pythonUtils_1.runPython).mockResolvedValue(pythonTests);
        jest.mocked(glob_1.globSync).mockReturnValueOnce(['test.py']);
        const result = await (0, testCaseReader_1.readTests)(['test.py:custom_function']);
        expect(pythonUtils_1.runPython).toHaveBeenCalledWith(expect.stringContaining('test.py'), 'custom_function', []);
        expect(result).toEqual(pythonTests);
    });
    it('should pass config to Python generator in readTests', async () => {
        const pythonTests = [
            {
                description: 'Python Test 1',
                vars: { a: '1' },
                assert: [],
                options: {},
            },
        ];
        jest.mocked(pythonUtils_1.runPython).mockResolvedValue(pythonTests);
        jest.mocked(glob_1.globSync).mockReturnValueOnce(['test.py']);
        const config = { foo: 'bar' };
        const result = await (0, testCaseReader_1.readTests)([{ path: 'test.py', config }]);
        expect(pythonUtils_1.runPython).toHaveBeenCalledWith(expect.stringContaining('test.py'), 'generate_tests', [
            config,
        ]);
        expect(result).toEqual(pythonTests);
    });
    it('should handle Python files with invalid function name in readTests', async () => {
        await expect((0, testCaseReader_1.readTests)(['test.py:invalid:extra'])).rejects.toThrow('Too many colons. Invalid test file script path: test.py:invalid:extra');
    });
    it('should handle Python files that return non-array in readTests', async () => {
        jest.mocked(pythonUtils_1.runPython).mockResolvedValue({ not: 'an array' });
        jest.mocked(glob_1.globSync).mockReturnValueOnce(['test.py']);
        await expect((0, testCaseReader_1.readTests)(['test.py'])).rejects.toThrow('Python test function must return a list of test cases, got object');
    });
    it('should handle file:// URLs with YAML files correctly in readTests', async () => {
        const yamlTests = [
            {
                description: 'Test 1',
                vars: { key1: 'value1' },
                assert: [{ type: 'equals', value: 'expected1' }],
            },
            {
                description: 'Test 2',
                vars: { key2: 'value2' },
                assert: [{ type: 'equals', value: 'expected2' }],
            },
        ];
        jest.mocked(fs.readFileSync).mockReturnValue(js_yaml_1.default.dump(yamlTests));
        jest.mocked(glob_1.globSync).mockReturnValue(['products.yaml']);
        const result = await (0, testCaseReader_1.readTests)(['file://products.yaml']);
        expect(result).toEqual(yamlTests);
        expect(glob_1.globSync).toHaveBeenCalledWith(expect.stringContaining('products.yaml'), expect.any(Object));
    });
    it('should warn when assert is found in vars', async () => {
        const testWithAssertInVars = [
            {
                description: 'Test case',
                vars: {
                    assert: [{ type: 'equals', value: 'test' }],
                },
            },
        ];
        jest.mocked(fs.readFileSync).mockReturnValue(js_yaml_1.default.dump(testWithAssertInVars));
        jest.mocked(glob_1.globSync).mockReturnValue(['test.yaml']);
        jest
            .mocked(envars_1.getEnvBool)
            .mockImplementation((key) => !key.includes('PROMPTFOO_NO_TESTCASE_ASSERT_WARNING'));
        const result = await (0, testCaseReader_1.readTests)(['test.yaml']);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(testWithAssertInVars[0]);
        expect(logger_1.default.warn).toHaveBeenCalledWith(expect.stringContaining('PROMPTFOO_NO_TESTCASE_ASSERT_WARNING'));
    });
    it('should not warn about assert in vars when environment variable is set', async () => {
        const testWithAssertInVars = [
            {
                description: 'Test case',
                vars: {
                    assert: { type: 'equals', value: 'test' },
                },
            },
        ];
        jest.mocked(fs.readFileSync).mockReturnValue(js_yaml_1.default.dump(testWithAssertInVars));
        jest.mocked(glob_1.globSync).mockReturnValue(['test.yaml']);
        jest
            .mocked(envars_1.getEnvBool)
            .mockImplementation((key) => key === 'PROMPTFOO_NO_TESTCASE_ASSERT_WARNING');
        await (0, testCaseReader_1.readTests)('test.yaml');
        expect(logger_1.default.warn).not.toHaveBeenCalledWith(expect.stringContaining('PROMPTFOO_NO_TESTCASE_ASSERT_WARNING'));
    });
    it('should handle file:// URLs with function names in readTests', async () => {
        const pythonTests = [
            {
                description: 'Python Test with file:// URL',
                vars: { var1: 'value1' },
                assert: [{ type: 'equals', value: 'expected1' }],
                options: {},
            },
        ];
        jest.mocked(pythonUtils_1.runPython).mockResolvedValue(pythonTests);
        jest.mocked(glob_1.globSync).mockReturnValueOnce(['test.py']);
        const result = await (0, testCaseReader_1.readTests)(['file://test.py:custom_function']);
        expect(pythonUtils_1.runPython).toHaveBeenCalledWith(expect.stringContaining('test.py'), 'custom_function', []);
        expect(result).toEqual(pythonTests);
    });
});
describe('testCaseFromCsvRow', () => {
    it('should convert a CSV row to a TestCase object', () => {
        const csvRow = {
            var1: 'value1',
            var2: 'value2',
            __expected: 'foobar',
            __expected1: 'is-json',
            __prefix: 'test-prefix',
            __suffix: 'test-suffix',
        };
        const testCase = (0, csv_1.testCaseFromCsvRow)(csvRow);
        expect(testCase).toEqual({
            vars: {
                var1: 'value1',
                var2: 'value2',
            },
            assert: [
                {
                    type: 'equals',
                    value: 'foobar',
                },
                {
                    type: 'is-json',
                },
            ],
            options: {
                prefix: 'test-prefix',
                suffix: 'test-suffix',
            },
        });
    });
});
describe('readVarsFiles', () => {
    beforeEach(() => {
        clearAllMocks();
        // Restore maybeLoadConfigFromExternalFile mock
        jest.mocked(file_1.maybeLoadConfigFromExternalFile).mockImplementation((config) => {
            // Handle arrays first to preserve their type
            if (Array.isArray(config)) {
                return config.map((item) => {
                    const mockFn = jest.requireMock('../../src/util/file').maybeLoadConfigFromExternalFile;
                    return mockFn(item);
                });
            }
            // Handle objects (but not arrays)
            if (config && typeof config === 'object' && config !== null) {
                const result = { ...config };
                for (const [key, value] of Object.entries(config)) {
                    if (typeof value === 'string' && value.startsWith('file://')) {
                        // Extract the file path from the file:// URL
                        const filePath = value.slice('file://'.length);
                        // Get the mocked file content using the extracted path
                        const fs = jest.requireMock('fs');
                        const fileContent = fs.readFileSync(filePath, 'utf-8');
                        if (typeof fileContent === 'string') {
                            try {
                                result[key] = JSON.parse(fileContent);
                            }
                            catch {
                                result[key] = fileContent;
                            }
                        }
                    }
                }
                return result;
            }
            return config;
        });
    });
    afterEach(() => {
        clearAllMocks();
    });
    it('should read variables from a single YAML file', async () => {
        const yamlContent = 'var1: value1\nvar2: value2';
        jest.mocked(fs.readFileSync).mockReturnValue(yamlContent);
        jest.mocked(glob_1.globSync).mockReturnValue(['vars.yaml']);
        const result = await (0, testCaseReader_1.readTestFiles)('vars.yaml');
        expect(result).toEqual({ var1: 'value1', var2: 'value2' });
    });
    it('should read variables from multiple YAML files', async () => {
        const yamlContent1 = 'var1: value1';
        const yamlContent2 = 'var2: value2';
        // Mock globSync to return both file paths
        jest.mocked(glob_1.globSync).mockImplementation((pattern) => {
            if (pattern.includes('vars1.yaml')) {
                return ['vars1.yaml'];
            }
            else if (pattern.includes('vars2.yaml')) {
                return ['vars2.yaml'];
            }
            return [];
        });
        // Mock readFileSync to return different content for each file
        jest.mocked(fs.readFileSync).mockImplementation((path) => {
            if (path.toString().includes('vars1.yaml')) {
                return yamlContent1;
            }
            else if (path.toString().includes('vars2.yaml')) {
                return yamlContent2;
            }
            return '';
        });
        const result = await (0, testCaseReader_1.readTestFiles)(['vars1.yaml', 'vars2.yaml']);
        expect(result).toEqual({ var1: 'value1', var2: 'value2' });
    });
});
describe('loadTestsFromGlob', () => {
    beforeEach(() => {
        clearAllMocks();
        // Explicitly set a simple pass-through mock to ensure no pollution from previous describe blocks
        // Individual tests will override this with their own specific implementations
        jest.mocked(file_1.maybeLoadConfigFromExternalFile).mockImplementation((config) => config);
    });
    afterEach(() => {
        clearAllMocks();
    });
    it('should handle Hugging Face dataset URLs', async () => {
        const mockDataset = [
            {
                description: 'Test 1',
                vars: { var1: 'value1' },
                assert: [{ type: 'equals', value: 'expected1' }],
                options: {},
            },
            {
                description: 'Test 2',
                vars: { var2: 'value2' },
                assert: [{ type: 'equals', value: 'expected2' }],
                options: {},
            },
        ];
        jest.mocked(huggingfaceDatasets_1.fetchHuggingFaceDataset).mockResolvedValue(mockDataset);
        const result = await (0, testCaseReader_1.loadTestsFromGlob)('huggingface://datasets/example/dataset');
        expect(huggingfaceDatasets_1.fetchHuggingFaceDataset).toHaveBeenCalledWith('huggingface://datasets/example/dataset');
        expect(result).toEqual(mockDataset);
    });
    it('should recursively resolve file:// references in YAML test files', async () => {
        // Set up mock implementation FIRST, before any other setup
        // Use jest.mocked() for consistency with clearAllMocks()
        const mockMaybeLoadConfig = jest.mocked(file_1.maybeLoadConfigFromExternalFile);
        mockMaybeLoadConfig.mockReset();
        const yamlContentWithRefs = [
            {
                description: 'Test with file refs',
                vars: {
                    input: 'file://input.txt',
                    expected: 'file://expected.json',
                },
                assert: ['file://assertions.yaml'],
            },
        ];
        const resolvedContent = [
            {
                description: 'Test with file refs',
                vars: {
                    input: 'What is 2 + 2?',
                    expected: { answer: '4' },
                },
                assert: [{ type: 'equals', value: '4' }],
            },
        ];
        // Mock maybeLoadConfigFromExternalFile to resolve file:// references
        mockMaybeLoadConfig.mockImplementation((config) => {
            // Handle arrays - preserve array type and return resolved content
            if (Array.isArray(config)) {
                // Map over array to handle each element
                return config.map((item) => {
                    // If it matches our test data structure, return the resolved version
                    if (item && item.description === 'Test with file refs') {
                        return resolvedContent[0];
                    }
                    return item;
                });
            }
            // For objects, preserve them as-is
            if (config && typeof config === 'object') {
                return config;
            }
            return config;
        });
        // Set up file system mocks AFTER setting up the maybeLoadConfigFromExternalFile mock
        jest.mocked(glob_1.globSync).mockReturnValue(['tests.yaml']);
        jest.mocked(fs.readFileSync).mockReturnValue(js_yaml_1.default.dump(yamlContentWithRefs));
        const result = await (0, testCaseReader_1.loadTestsFromGlob)('tests.yaml');
        // The mock should be called with the array from YAML
        expect(mockMaybeLoadConfig).toHaveBeenCalled();
        expect(result).toEqual(resolvedContent);
    });
    it('should handle nested file:// references in complex test structures', async () => {
        // Set up mock implementation FIRST, before any other setup
        // Use jest.mocked() for consistency with clearAllMocks()
        const mockMaybeLoadConfig = jest.mocked(file_1.maybeLoadConfigFromExternalFile);
        mockMaybeLoadConfig.mockReset();
        const complexYamlWithRefs = [
            {
                description: 'Complex test',
                vars: {
                    config: 'file://config.yaml',
                    prompts: ['file://prompt1.txt', 'file://prompt2.txt'],
                },
                assert: ['file://assert1.yaml', 'file://assert2.yaml'],
            },
        ];
        const resolvedContent = [
            {
                description: 'Complex test',
                vars: {
                    config: { temperature: 0.7, maxTokens: 100 },
                    prompts: ['First prompt', 'Second prompt'],
                },
                assert: [
                    { type: 'equals', value: 'expected1' },
                    { type: 'contains', value: 'expected2' },
                ],
            },
        ];
        // Mock maybeLoadConfigFromExternalFile to resolve file:// references
        mockMaybeLoadConfig.mockImplementation((config) => {
            // Handle arrays - preserve array type and return resolved content
            if (Array.isArray(config)) {
                return config.map((item) => {
                    if (item && item.description === 'Complex test') {
                        return resolvedContent[0];
                    }
                    return item;
                });
            }
            // For objects, preserve them as-is
            if (config && typeof config === 'object') {
                return config;
            }
            return config;
        });
        // Set up file system mocks AFTER setting up the maybeLoadConfigFromExternalFile mock
        jest.mocked(glob_1.globSync).mockReturnValue(['complex-tests.yaml']);
        jest.mocked(fs.readFileSync).mockReturnValue(js_yaml_1.default.dump(complexYamlWithRefs));
        const result = await (0, testCaseReader_1.loadTestsFromGlob)('complex-tests.yaml');
        expect(mockMaybeLoadConfig).toHaveBeenCalled();
        // Note: provider field is not included in the resolved content from our test file structure
        expect(result[0].description).toEqual(resolvedContent[0].description);
        expect(result[0].vars).toEqual(resolvedContent[0].vars);
        expect(result[0].assert).toEqual(resolvedContent[0].assert);
    });
    it('should preserve Python assertion file references when loading YAML tests', async () => {
        // This test verifies the fix for issue #5519
        // Set up mock implementation FIRST, before any other setup
        // Use jest.mocked() for consistency with clearAllMocks()
        const mockMaybeLoadConfig = jest.mocked(file_1.maybeLoadConfigFromExternalFile);
        mockMaybeLoadConfig.mockReset();
        const yamlContentWithPythonAssertion = [
            {
                vars: { name: 'Should PASS' },
                assert: [
                    {
                        type: 'python',
                        value: 'file://good_assertion.py',
                    },
                ],
            },
        ];
        // Mock maybeLoadConfigFromExternalFile to preserve Python files in assertion contexts
        mockMaybeLoadConfig.mockImplementation((config) => {
            // Handle arrays - preserve array type
            if (Array.isArray(config)) {
                return config;
            }
            // For objects, preserve them as-is (including file:// references for Python assertions)
            if (config && typeof config === 'object') {
                return config;
            }
            return config;
        });
        // Set up file system mocks AFTER setting up the maybeLoadConfigFromExternalFile mock
        jest.mocked(glob_1.globSync).mockReturnValue(['tests.yaml']);
        jest.mocked(fs.readFileSync).mockReturnValue(js_yaml_1.default.dump(yamlContentWithPythonAssertion));
        const result = await (0, testCaseReader_1.loadTestsFromGlob)('tests.yaml');
        expect(mockMaybeLoadConfig).toHaveBeenCalled();
        expect(result[0].assert[0].value).toBe('file://good_assertion.py'); // Should remain as file reference
    });
});
describe('CSV parsing with JSON fields', () => {
    beforeEach(() => {
        clearAllMocks();
        jest.mocked(envars_1.getEnvBool).mockImplementation((_key, defaultValue = false) => defaultValue);
        jest.mocked(envars_1.getEnvString).mockImplementation((_key, defaultValue) => defaultValue || '');
    });
    afterEach(() => {
        clearAllMocks();
    });
    it('should parse CSV file containing properly escaped JSON fields in strict mode', async () => {
        const csvContent = `label,query,expected_json_format,context
my_test_label,What is the date?,"{\""answer\"":""""}",file://../get_context.py`;
        jest.spyOn(fs, 'readFileSync').mockReturnValue(csvContent);
        const testCases = await (0, testCaseReader_1.readStandaloneTestsFile)('dummy.csv');
        expect(testCases).toHaveLength(1);
        expect(testCases[0].vars).toEqual({
            label: 'my_test_label',
            query: 'What is the date?',
            expected_json_format: '{"answer":""}',
            context: 'file://../get_context.py',
        });
        jest.mocked(fs.readFileSync).mockRestore();
    });
    it('should fall back to relaxed parsing for unescaped JSON fields', async () => {
        const csvContent = `label,query,expected_json_format,context
my_test_label,What is the date?,{"answer":""},file://../get_context.py`;
        jest.spyOn(fs, 'readFileSync').mockReturnValue(csvContent);
        const testCases = await (0, testCaseReader_1.readStandaloneTestsFile)('dummy.csv');
        expect(testCases).toHaveLength(1);
        expect(testCases[0].vars).toEqual({
            label: 'my_test_label',
            query: 'What is the date?',
            expected_json_format: '{"answer":""}',
            context: 'file://../get_context.py',
        });
        jest.mocked(fs.readFileSync).mockRestore();
    });
    it('should enforce strict mode when PROMPTFOO_CSV_STRICT=true', async () => {
        jest
            .mocked(envars_1.getEnvBool)
            .mockImplementation((key, defaultValue = false) => key === 'PROMPTFOO_CSV_STRICT' ? true : defaultValue);
        const csvContent = `label,query,expected_json_format,context
my_test_label,What is the date?,{"answer":""},file://../get_context.py`;
        jest.spyOn(fs, 'readFileSync').mockReturnValue(csvContent);
        await expect((0, testCaseReader_1.readStandaloneTestsFile)('dummy.csv')).rejects.toThrow('Invalid Opening Quote: a quote is found on field');
        jest.mocked(fs.readFileSync).mockRestore();
    });
    it('should propagate non-quote-related CSV errors', async () => {
        // Create CSV content with inconsistent column count to trigger "Invalid Record Length" error
        const csvContent = `label,query,expected_json_format,context
my_test_label,What is the date?
another_label,What is the time?,too,many,columns,here`;
        jest.spyOn(fs, 'readFileSync').mockReturnValue(csvContent);
        // Use default settings (not strict mode) to get past quote checking
        jest.mocked(envars_1.getEnvBool).mockImplementation((_key, defaultValue = false) => defaultValue);
        jest
            .mocked(envars_1.getEnvString)
            .mockImplementation((key, defaultValue) => key === 'PROMPTFOO_CSV_DELIMITER' ? ',' : defaultValue || '');
        // The CSV parser should throw an error about inconsistent column count
        await expect((0, testCaseReader_1.readStandaloneTestsFile)('dummy.csv')).rejects.toThrow('Invalid Record Length');
        jest.mocked(fs.readFileSync).mockRestore();
    });
});
//# sourceMappingURL=testCaseReader.test.js.map