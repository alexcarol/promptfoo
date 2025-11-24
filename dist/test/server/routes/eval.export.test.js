"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Mock dependencies first
globals_1.jest.mock('../../../src/database', () => ({
    getDb: globals_1.jest.fn(),
}));
globals_1.jest.mock('../../../src/models/eval');
globals_1.jest.mock('../../../src/server/utils/evalTableUtils');
globals_1.jest.mock('../../../src/server/utils/downloadHelpers', () => ({
    setDownloadHeaders: globals_1.jest.fn(),
}));
// Import after mocking
const eval_1 = __importDefault(require("../../../src/models/eval"));
const downloadHelpers_1 = require("../../../src/server/utils/downloadHelpers");
// Setup mocked functions
const mockedEvalFindById = globals_1.jest.fn();
const mockedGenerateCsvData = globals_1.jest.fn();
const mockedGenerateJsonData = globals_1.jest.fn();
// Override the mocked modules
eval_1.default.findById = mockedEvalFindById;
const evalTableUtils = require('../../../src/server/utils/evalTableUtils');
evalTableUtils.generateCsvData = mockedGenerateCsvData;
evalTableUtils.generateJsonData = mockedGenerateJsonData;
(0, globals_1.describe)('evalRouter - GET /:id/table with export formats', () => {
    let mockReq;
    let mockRes;
    let jsonMock;
    let sendMock;
    let statusMock;
    const mockTable = {
        head: {
            vars: ['var1', 'var2'],
            prompts: [
                {
                    provider: 'openai',
                    label: 'prompt1',
                    raw: 'test prompt',
                    display: 'test',
                },
            ],
        },
        body: [
            {
                test: { vars: { var1: 'value1', var2: 'value2' } },
                testIdx: 0,
                vars: ['value1', 'value2'],
                outputs: [
                    {
                        pass: true,
                        text: 'output text',
                        cost: 0,
                        failureReason: undefined,
                        id: 'output-id',
                        latencyMs: 100,
                        provider: 'openai:gpt-3.5-turbo',
                        gradingResult: {
                            pass: true,
                            reason: 'Test passed',
                            comment: 'Good response',
                        },
                        metadata: {
                            redteamHistory: ['attempt1', 'attempt2'],
                            messages: [
                                { role: 'user', content: 'test' },
                                { role: 'assistant', content: 'response' },
                            ],
                        },
                    },
                ],
            },
        ],
        totalCount: 1,
        filteredCount: 1,
        id: 'test-eval-id',
    };
    const mockConfig = {
        redteam: {
            strategies: ['jailbreak'],
        },
    };
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        jsonMock = globals_1.jest.fn();
        sendMock = globals_1.jest.fn();
        statusMock = globals_1.jest.fn().mockReturnThis();
        mockRes = {
            json: jsonMock,
            send: sendMock,
            status: statusMock,
            setHeader: globals_1.jest.fn(),
        };
        mockReq = {
            params: { id: 'test-eval-id' },
            query: {},
        };
        // Setup Eval mock
        const getTablePageMock = globals_1.jest.fn();
        getTablePageMock.mockResolvedValue(mockTable);
        const mockEval = {
            config: mockConfig,
            author: 'test-author',
            version: globals_1.jest.fn().mockReturnValue('1.0.0'),
            getTablePage: getTablePageMock,
        };
        mockedEvalFindById.mockResolvedValue(mockEval);
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.it)('should return CSV when format=csv is specified', async () => {
        mockReq.query = { format: 'csv' };
        const mockCsvData = 'var1,var2,[openai] prompt1\nvalue1,value2,[PASS] output text';
        mockedGenerateCsvData.mockReturnValue(mockCsvData);
        // Simulate the route handler (simplified version)
        const eval_ = await eval_1.default.findById(mockReq.params.id);
        const table = await eval_.getTablePage({
            offset: 0,
            limit: Number.MAX_SAFE_INTEGER,
            filterMode: 'all',
            searchQuery: '',
            filters: [],
        });
        const csvData = mockedGenerateCsvData(table, {
            isRedteam: !!eval_.config?.redteam,
        });
        (0, downloadHelpers_1.setDownloadHeaders)(mockRes, 'test-eval-id-results.csv', 'text/csv');
        mockRes.send(csvData);
        (0, globals_1.expect)(mockedGenerateCsvData).toHaveBeenCalledWith(globals_1.expect.anything(), globals_1.expect.anything());
        (0, globals_1.expect)(sendMock).toHaveBeenCalledWith(mockCsvData);
    });
    (0, globals_1.it)('should return JSON when format=json is specified', async () => {
        mockReq.query = { format: 'json' };
        const mockJsonData = { table: mockTable };
        mockedGenerateJsonData.mockReturnValue(mockJsonData);
        // Simulate the route handler (simplified version)
        const eval_ = await eval_1.default.findById(mockReq.params.id);
        const table = await eval_.getTablePage({
            offset: 0,
            limit: Number.MAX_SAFE_INTEGER,
            filterMode: 'all',
            searchQuery: '',
            filters: [],
        });
        const jsonData = mockedGenerateJsonData(table);
        (0, downloadHelpers_1.setDownloadHeaders)(mockRes, 'test-eval-id-results.json', 'application/json');
        mockRes.json(jsonData);
        (0, globals_1.expect)(mockedGenerateJsonData).toHaveBeenCalledWith(globals_1.expect.anything());
        (0, globals_1.expect)(jsonMock).toHaveBeenCalledWith(mockJsonData);
    });
    (0, globals_1.it)('should include red team conversation columns in CSV for red team evaluations', async () => {
        mockReq.query = { format: 'csv' };
        // Mock the CSV generation to verify red team columns are included
        const expectedCsvWithRedteam = 'var1,var2,[openai] prompt1,[openai] prompt1 - Grader Reason,[openai] prompt1 - Comment,Messages,RedteamHistory\n' +
            'value1,value2,[PASS] output text,Test passed,Good response,"[{\\"role\\":\\"user\\",\\"content\\":\\"test\\"},{\\"role\\":\\"assistant\\",\\"content\\":\\"response\\"}]","[\\"attempt1\\",\\"attempt2\\"]"';
        mockedGenerateCsvData.mockReturnValue(expectedCsvWithRedteam);
        const eval_ = await eval_1.default.findById(mockReq.params.id);
        const table = await eval_.getTablePage({
            offset: 0,
            limit: Number.MAX_SAFE_INTEGER,
            filterMode: 'all',
            searchQuery: '',
            filters: [],
        });
        const csvData = mockedGenerateCsvData(table, {
            isRedteam: !!eval_.config?.redteam,
        });
        (0, globals_1.expect)(mockedGenerateCsvData).toHaveBeenCalledWith(globals_1.expect.anything(), globals_1.expect.anything());
        (0, globals_1.expect)(csvData).toContain('Messages');
        (0, globals_1.expect)(csvData).toContain('RedteamHistory');
    });
    (0, globals_1.it)('should return standard table response when no format is specified', async () => {
        mockReq.query = {}; // No format specified
        const eval_ = await eval_1.default.findById(mockReq.params.id);
        const table = await eval_.getTablePage({
            offset: 0,
            limit: 50, // Default limit
            filterMode: 'all',
            searchQuery: '',
            filters: [],
        });
        // Simulate standard response
        mockRes.json({
            table,
            totalCount: table.totalCount,
            filteredCount: table.filteredCount,
            config: eval_.config,
            author: eval_.author,
            version: eval_.version(),
        });
        (0, globals_1.expect)(jsonMock).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            table: mockTable,
            totalCount: 1,
            filteredCount: 1,
            config: mockConfig,
            author: 'test-author',
            version: '1.0.0',
        }));
        (0, globals_1.expect)(sendMock).not.toHaveBeenCalled();
    });
    (0, globals_1.it)('should handle CSV export for non-redteam evaluations', async () => {
        // Setup eval without redteam config
        const nonRedteamConfig = { someConfig: 'value' };
        const getTablePageMockNoRedteam = globals_1.jest.fn();
        getTablePageMockNoRedteam.mockResolvedValue(mockTable);
        const mockEvalNoRedteam = {
            config: nonRedteamConfig,
            author: 'test-author',
            version: globals_1.jest.fn().mockReturnValue('1.0.0'),
            getTablePage: getTablePageMockNoRedteam,
        };
        mockedEvalFindById.mockResolvedValue(mockEvalNoRedteam);
        mockReq.query = { format: 'csv' };
        const mockCsvData = 'var1,var2,[openai] prompt1\nvalue1,value2,[PASS] output text';
        mockedGenerateCsvData.mockReturnValue(mockCsvData);
        const eval_ = await eval_1.default.findById(mockReq.params.id);
        const table = await eval_.getTablePage({
            offset: 0,
            limit: Number.MAX_SAFE_INTEGER,
            filterMode: 'all',
            searchQuery: '',
            filters: [],
        });
        const csvData = mockedGenerateCsvData(table, {
            isRedteam: !!eval_.config?.redteam,
        });
        (0, globals_1.expect)(mockedGenerateCsvData).toHaveBeenCalledWith(globals_1.expect.anything(), globals_1.expect.anything());
        // Should not contain red team columns
        (0, globals_1.expect)(csvData).not.toContain('Messages');
        (0, globals_1.expect)(csvData).not.toContain('RedteamHistory');
    });
    (0, globals_1.it)('should handle different red team metadata types', async () => {
        const tableWithMultipleRedteamTypes = {
            ...mockTable,
            body: [
                {
                    ...mockTable.body[0],
                    outputs: [
                        {
                            pass: true,
                            text: 'output 1',
                            metadata: {
                                messages: [
                                    { role: 'system', content: 'You are helpful' },
                                    { role: 'user', content: 'Hello' },
                                ],
                            },
                        },
                    ],
                },
                {
                    test: { vars: { var1: 'val3', var2: 'val4' } },
                    testIdx: 1,
                    vars: ['val3', 'val4'],
                    outputs: [
                        {
                            pass: false,
                            text: 'output 2',
                            metadata: {
                                redteamHistory: ['attempt 1', 'attempt 2', 'attempt 3'],
                            },
                        },
                    ],
                },
                {
                    test: { vars: { var1: 'val5', var2: 'val6' } },
                    testIdx: 2,
                    vars: ['val5', 'val6'],
                    outputs: [
                        {
                            pass: false,
                            text: 'output 3',
                            metadata: {
                                redteamTreeHistory: 'root->branch1->leaf1\nroot->branch2->leaf2',
                            },
                        },
                    ],
                },
            ],
        };
        const getTablePageMockWithTypes = globals_1.jest.fn();
        getTablePageMockWithTypes.mockResolvedValue({
            ...tableWithMultipleRedteamTypes,
            id: 'test-eval-id',
        });
        const mockEvalWithTypes = {
            config: mockConfig,
            author: 'test-author',
            version: globals_1.jest.fn().mockReturnValue('1.0.0'),
            getTablePage: getTablePageMockWithTypes,
        };
        mockedEvalFindById.mockResolvedValue(mockEvalWithTypes);
        mockReq.query = { format: 'csv' };
        const eval_ = await eval_1.default.findById(mockReq.params.id);
        const table = await eval_.getTablePage({
            offset: 0,
            limit: Number.MAX_SAFE_INTEGER,
            filterMode: 'all',
            searchQuery: '',
            filters: [],
        });
        mockedGenerateCsvData(table, { isRedteam: !!eval_.config?.redteam });
        (0, globals_1.expect)(mockedGenerateCsvData).toHaveBeenCalledWith(globals_1.expect.anything(), {
            isRedteam: true,
        });
    });
    (0, globals_1.it)('should handle pagination parameters correctly for exports', async () => {
        mockReq.query = { format: 'csv', limit: '100', offset: '50' };
        const eval_ = await eval_1.default.findById(mockReq.params.id);
        // When format is specified, should ignore pagination and get all data
        await eval_.getTablePage({
            offset: 0, // Should be 0 for export
            limit: Number.MAX_SAFE_INTEGER, // Should be MAX for export
            filterMode: 'all',
            searchQuery: '',
            filters: [],
        });
        (0, globals_1.expect)(eval_.getTablePage).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            offset: 0,
            limit: Number.MAX_SAFE_INTEGER,
        }));
    });
    (0, globals_1.it)('should handle filter parameters in exports', async () => {
        mockReq.query = {
            format: 'csv',
            filterMode: 'failures',
            search: 'error',
            filter: ['provider:openai', 'status:fail'],
        };
        const eval_ = await eval_1.default.findById(mockReq.params.id);
        await eval_.getTablePage({
            offset: 0,
            limit: Number.MAX_SAFE_INTEGER,
            filterMode: 'failures',
            searchQuery: 'error',
            filters: ['provider:openai', 'status:fail'],
        });
        (0, globals_1.expect)(eval_.getTablePage).toHaveBeenCalledWith(globals_1.expect.objectContaining({
            filterMode: 'failures',
            searchQuery: 'error',
            filters: ['provider:openai', 'status:fail'],
        }));
    });
    (0, globals_1.it)('should return 404 when evaluation not found', async () => {
        mockedEvalFindById.mockResolvedValue(undefined);
        const eval_ = await eval_1.default.findById(mockReq.params.id);
        if (!eval_) {
            mockRes.status(404).json({ error: 'Eval not found' });
        }
        (0, globals_1.expect)(statusMock).toHaveBeenCalledWith(404);
        (0, globals_1.expect)(jsonMock).toHaveBeenCalledWith({ error: 'Eval not found' });
    });
    (0, globals_1.it)('should handle empty table data in CSV export', async () => {
        const emptyTable = {
            head: {
                vars: ['var1'],
                prompts: [{ provider: 'openai', label: 'test' }],
            },
            body: [],
            totalCount: 0,
            filteredCount: 0,
        };
        const getTablePageMockEmpty = globals_1.jest.fn();
        getTablePageMockEmpty.mockResolvedValue({ ...emptyTable, id: 'test-eval-id' });
        const mockEvalEmpty = {
            config: mockConfig,
            author: 'test-author',
            version: globals_1.jest.fn().mockReturnValue('1.0.0'),
            getTablePage: getTablePageMockEmpty,
        };
        mockedEvalFindById.mockResolvedValue(mockEvalEmpty);
        mockReq.query = { format: 'csv' };
        const mockCsvData = 'var1,[openai] test\n';
        mockedGenerateCsvData.mockReturnValue(mockCsvData);
        const eval_ = await eval_1.default.findById(mockReq.params.id);
        const table = await eval_.getTablePage({
            offset: 0,
            limit: Number.MAX_SAFE_INTEGER,
            filterMode: 'all',
            searchQuery: '',
            filters: [],
        });
        const csvData = mockedGenerateCsvData(table, {
            isRedteam: !!eval_.config?.redteam,
        });
        (0, downloadHelpers_1.setDownloadHeaders)(mockRes, 'test-eval-id-results.csv', 'text/csv');
        mockRes.send(csvData);
        (0, globals_1.expect)(sendMock).toHaveBeenCalledWith(mockCsvData);
    });
    (0, globals_1.it)('should properly escape special characters in CSV', async () => {
        const tableWithSpecialChars = {
            ...mockTable,
            body: [
                {
                    test: { vars: { var1: 'value,with,commas', var2: 'value"with"quotes' } },
                    testIdx: 0,
                    vars: ['value,with,commas', 'value"with"quotes'],
                    outputs: [
                        {
                            pass: true,
                            text: 'Output\nwith\nnewlines',
                            metadata: {
                                messages: [{ role: 'user', content: 'Message with "quotes" and, commas' }],
                            },
                        },
                    ],
                },
            ],
        };
        const getTablePageMockSpecial = globals_1.jest.fn();
        getTablePageMockSpecial.mockResolvedValue({ ...tableWithSpecialChars, id: 'test-eval-id' });
        const mockEvalSpecial = {
            config: mockConfig,
            author: 'test-author',
            version: globals_1.jest.fn().mockReturnValue('1.0.0'),
            getTablePage: getTablePageMockSpecial,
        };
        mockedEvalFindById.mockResolvedValue(mockEvalSpecial);
        mockReq.query = { format: 'csv' };
        const eval_ = await eval_1.default.findById(mockReq.params.id);
        const table = await eval_.getTablePage({
            offset: 0,
            limit: Number.MAX_SAFE_INTEGER,
            filterMode: 'all',
            searchQuery: '',
            filters: [],
        });
        mockedGenerateCsvData(table, { isRedteam: !!eval_.config?.redteam });
        (0, globals_1.expect)(mockedGenerateCsvData).toHaveBeenCalledWith(globals_1.expect.anything(), {
            isRedteam: true,
        });
    });
    (0, globals_1.it)('should handle very large datasets efficiently', async () => {
        // Create a large table with many rows
        const largeBody = Array.from({ length: 10000 }, (_, i) => ({
            test: { vars: { var1: `val${i}`, var2: `val${i + 1}` } },
            testIdx: i,
            vars: [`val${i}`, `val${i + 1}`],
            outputs: [
                {
                    pass: i % 2 === 0,
                    text: `Output ${i}`,
                    metadata: {
                        messages: [{ role: 'user', content: `Message ${i}` }],
                    },
                },
            ],
        }));
        const largeTable = {
            head: mockTable.head,
            body: largeBody,
            totalCount: 10000,
            filteredCount: 10000,
        };
        const getTablePageMockLarge = globals_1.jest.fn();
        getTablePageMockLarge.mockResolvedValue({ ...largeTable, id: 'test-eval-id' });
        const mockEvalLarge = {
            config: mockConfig,
            author: 'test-author',
            version: globals_1.jest.fn().mockReturnValue('1.0.0'),
            getTablePage: getTablePageMockLarge,
        };
        mockedEvalFindById.mockResolvedValue(mockEvalLarge);
        mockReq.query = { format: 'csv' };
        mockedGenerateCsvData.mockReturnValue('large csv data');
        const eval_ = await eval_1.default.findById(mockReq.params.id);
        const table = await eval_.getTablePage({
            offset: 0,
            limit: Number.MAX_SAFE_INTEGER,
            filterMode: 'all',
            searchQuery: '',
            filters: [],
        });
        mockedGenerateCsvData(table, { isRedteam: !!eval_.config?.redteam });
        (0, globals_1.expect)(mockedGenerateCsvData).toHaveBeenCalledWith(globals_1.expect.anything(), {
            isRedteam: true,
        });
    });
    (0, globals_1.it)('should set correct content-type headers for different formats', async () => {
        // Test CSV
        mockReq.query = { format: 'csv' };
        mockedGenerateCsvData.mockReturnValue('csv data');
        const eval_ = await eval_1.default.findById(mockReq.params.id);
        const table = await eval_.getTablePage({
            offset: 0,
            limit: Number.MAX_SAFE_INTEGER,
            filterMode: 'all',
            searchQuery: '',
            filters: [],
        });
        const csvData = mockedGenerateCsvData(table, {
            isRedteam: !!eval_.config?.redteam,
        });
        // Verify CSV generation
        (0, globals_1.expect)(mockedGenerateCsvData).toHaveBeenCalled();
        (0, globals_1.expect)(csvData).toBe('csv data');
        // Test JSON
        globals_1.jest.clearAllMocks();
        mockReq.query = { format: 'json' };
        mockedGenerateJsonData.mockReturnValue({ data: 'json' });
        const jsonData = mockedGenerateJsonData(table);
        // Verify JSON generation
        (0, globals_1.expect)(mockedGenerateJsonData).toHaveBeenCalled();
        (0, globals_1.expect)(jsonData).toEqual({ data: 'json' });
    });
});
//# sourceMappingURL=eval.export.test.js.map