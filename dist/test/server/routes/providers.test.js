"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../../../src/server/server");
// Mock dependencies
jest.mock('../../../src/providers/index');
jest.mock('../../../src/validators/testProvider');
jest.mock('../../../src/server/config/serverConfig');
// Import after mocking
const index_1 = require("../../../src/providers/index");
const testProvider_1 = require("../../../src/validators/testProvider");
const serverConfig_1 = require("../../../src/server/config/serverConfig");
const mockedLoadApiProvider = jest.mocked(index_1.loadApiProvider);
const mockedTestProviderConnectivity = jest.mocked(testProvider_1.testProviderConnectivity);
const mockedGetAvailableProviders = jest.mocked(serverConfig_1.getAvailableProviders);
describe('Providers Routes', () => {
    describe('GET /providers', () => {
        let app;
        beforeEach(() => {
            jest.clearAllMocks();
            app = (0, server_1.createApp)();
        });
        it('should return default providers when no custom config exists', async () => {
            // getAvailableProviders returns empty array when no config
            mockedGetAvailableProviders.mockReturnValue([]);
            const response = await (0, supertest_1.default)(app).get('/api/providers');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('data');
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('providers');
            expect(response.body.data).toHaveProperty('hasCustomConfig');
            expect(response.body.data.hasCustomConfig).toBe(false);
            expect(Array.isArray(response.body.data.providers)).toBe(true);
            // Should return defaults (non-empty)
            expect(response.body.data.providers.length).toBeGreaterThan(0);
            // Check structure
            expect(response.body.data.providers[0]).toHaveProperty('id');
        });
        it('should return custom providers from server config', async () => {
            const customProviders = [
                { id: 'openai:gpt-4o', label: 'GPT-4o' },
                { id: 'anthropic:messages:claude-sonnet-4-5-20250929', label: 'Claude 4.5 Sonnet' },
            ];
            mockedGetAvailableProviders.mockReturnValue(customProviders);
            const response = await (0, supertest_1.default)(app).get('/api/providers');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    providers: customProviders,
                    hasCustomConfig: true,
                },
            });
        });
        it('should return providers with full config', async () => {
            const customProviders = [
                {
                    id: 'http://internal-llm.company.com/v1',
                    label: 'Internal LLM',
                    config: {
                        method: 'POST',
                        headers: { Authorization: 'Bearer token' },
                    },
                },
            ];
            mockedGetAvailableProviders.mockReturnValue(customProviders);
            const response = await (0, supertest_1.default)(app).get('/api/providers');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.hasCustomConfig).toBe(true);
            expect(response.body.data.providers).toEqual(customProviders);
            expect(response.body.data.providers[0].config).toEqual({
                method: 'POST',
                headers: { Authorization: 'Bearer token' },
            });
        });
    });
    describe('GET /providers/config-status', () => {
        let app;
        beforeEach(() => {
            jest.clearAllMocks();
            app = (0, server_1.createApp)();
        });
        it('should return hasCustomConfig: false when no custom config exists', async () => {
            // getAvailableProviders returns empty array when no config
            mockedGetAvailableProviders.mockReturnValue([]);
            const response = await (0, supertest_1.default)(app).get('/api/providers/config-status');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: { hasCustomConfig: false },
            });
        });
        it('should return hasCustomConfig: true when custom config exists', async () => {
            const customProviders = [
                { id: 'openai:gpt-4o-mini' },
                { id: 'anthropic:messages:claude-haiku-4-5-20251001' },
            ];
            mockedGetAvailableProviders.mockReturnValue(customProviders);
            const response = await (0, supertest_1.default)(app).get('/api/providers/config-status');
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: { hasCustomConfig: true },
            });
        });
    });
    describe('POST /providers/test', () => {
        let app;
        let mockProvider;
        beforeEach(() => {
            jest.clearAllMocks();
            app = (0, server_1.createApp)();
            // Setup mock provider
            mockProvider = {
                id: jest.fn(() => 'test-provider'),
                callApi: jest.fn(),
                config: {},
            };
            // Default mock implementations
            mockedLoadApiProvider.mockResolvedValue(mockProvider);
        });
        it('should handle valid request with prompt', async () => {
            const testPrompt = 'Test prompt';
            const providerOptions = {
                id: 'http://example.com/api',
                config: {
                    method: 'POST',
                },
            };
            const mockResult = {
                success: true,
                message: 'Provider test successful',
                providerResponse: { output: 'Test response' },
                transformedRequest: { url: 'http://example.com/api' },
            };
            mockedTestProviderConnectivity.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(app).post('/api/providers/test').send({
                prompt: testPrompt,
                providerOptions,
            });
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                testResult: {
                    success: true,
                    message: 'Provider test successful',
                    error: undefined,
                    changes_needed: undefined,
                    changes_needed_reason: undefined,
                    changes_needed_suggestions: undefined,
                },
                providerResponse: { output: 'Test response' },
                transformedRequest: { url: 'http://example.com/api' },
            });
            expect(mockedLoadApiProvider).toHaveBeenCalledWith('http://example.com/api', {
                options: {
                    ...providerOptions,
                    config: {
                        ...providerOptions.config,
                        maxRetries: 1,
                    },
                },
            });
            expect(mockedTestProviderConnectivity).toHaveBeenCalledWith(mockProvider, testPrompt);
        });
        it('should handle valid request without prompt (optional)', async () => {
            const providerOptions = {
                id: 'http://example.com/api',
                config: {},
            };
            const mockResult = {
                success: true,
                message: 'Provider test successful',
            };
            mockedTestProviderConnectivity.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(app).post('/api/providers/test').send({
                providerOptions,
            });
            expect(response.status).toBe(200);
            expect(mockedTestProviderConnectivity).toHaveBeenCalledWith(mockProvider, undefined);
        });
        it('should return 400 for missing providerOptions', async () => {
            const response = await (0, supertest_1.default)(app).post('/api/providers/test').send({
                prompt: 'Test prompt',
            });
            expect(response.status).toBe(400);
            expect(response.body).toEqual(expect.objectContaining({
                error: expect.stringContaining('providerOptions'),
            }));
        });
        it('should throw error for missing provider id', async () => {
            const providerOptions = {
                config: {},
            };
            const response = await (0, supertest_1.default)(app).post('/api/providers/test').send({
                providerOptions,
            });
            // The route should catch the error and return 500
            expect(response.status).toBe(500);
        });
        it('should return 400 for malformed body with extra fields', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/providers/test')
                .send({
                providerOptions: {
                    id: 'test-provider',
                    unexpectedField: 'should cause validation error',
                },
                prompt: 'Test',
            });
            expect(response.status).toBe(400);
            expect(response.body).toEqual(expect.objectContaining({
                error: expect.stringContaining('Unrecognized key'),
            }));
        });
        it('should handle provider loading failure', async () => {
            const providerOptions = {
                id: 'invalid-provider',
                config: {},
            };
            mockedLoadApiProvider.mockRejectedValue(new Error('Failed to load provider'));
            const response = await (0, supertest_1.default)(app).post('/api/providers/test').send({
                providerOptions,
            });
            // The route should catch the error and return 500
            expect(response.status).toBe(500);
        });
        it('should handle connectivity test failure', async () => {
            const providerOptions = {
                id: 'http://example.com/api',
                config: {},
            };
            const mockResult = {
                success: false,
                message: 'Connection failed',
                error: 'Network timeout',
            };
            mockedTestProviderConnectivity.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(app).post('/api/providers/test').send({
                providerOptions,
                prompt: 'Test',
            });
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                testResult: {
                    success: false,
                    message: 'Connection failed',
                    error: 'Network timeout',
                    changes_needed: undefined,
                    changes_needed_reason: undefined,
                    changes_needed_suggestions: undefined,
                },
                providerResponse: undefined,
                transformedRequest: undefined,
            });
        });
        it('should handle successful test with analysis and suggestions', async () => {
            const providerOptions = {
                id: 'http://example.com/api',
                config: {},
            };
            const mockResult = {
                success: true,
                message: 'Test completed with suggestions',
                providerResponse: { output: 'Response' },
                analysis: {
                    changes_needed: true,
                    changes_needed_reason: 'Response format is not optimal',
                    changes_needed_suggestions: [
                        'Add response transform to extract text field',
                        'Update headers to include authentication',
                    ],
                },
            };
            mockedTestProviderConnectivity.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(app).post('/api/providers/test').send({
                providerOptions,
                prompt: 'Test',
            });
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                testResult: {
                    success: true,
                    message: 'Test completed with suggestions',
                    error: undefined,
                    changes_needed: true,
                    changes_needed_reason: 'Response format is not optimal',
                    changes_needed_suggestions: [
                        'Add response transform to extract text field',
                        'Update headers to include authentication',
                    ],
                },
                providerResponse: { output: 'Response' },
                transformedRequest: undefined,
            });
        });
        it('should properly structure response with all fields', async () => {
            const providerOptions = {
                id: 'http://example.com/api',
                config: {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                },
            };
            const mockResult = {
                success: true,
                message: 'All systems operational',
                error: undefined,
                providerResponse: {
                    output: 'AI response text',
                    metadata: { latency: 150 },
                },
                transformedRequest: {
                    url: 'http://example.com/api',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: { prompt: 'Comprehensive test' },
                },
                analysis: {
                    changes_needed: false,
                },
            };
            mockedTestProviderConnectivity.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(app).post('/api/providers/test').send({
                providerOptions,
                prompt: 'Comprehensive test',
            });
            expect(response.status).toBe(200);
            // Verify testResult structure
            expect(response.body.testResult.success).toBe(true);
            expect(response.body.testResult.message).toBe('All systems operational');
            expect(response.body.testResult.error).toBeUndefined();
            expect(response.body.testResult.changes_needed).toBe(false);
            expect(response.body.testResult.changes_needed_reason).toBeUndefined();
            expect(response.body.testResult.changes_needed_suggestions).toBeUndefined();
            // Verify providerResponse
            expect(response.body.providerResponse).toEqual({
                output: 'AI response text',
                metadata: { latency: 150 },
            });
            // Verify transformedRequest
            expect(response.body.transformedRequest).toEqual({
                url: 'http://example.com/api',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: { prompt: 'Comprehensive test' },
            });
        });
        it('should pass maxRetries: 1 to provider config', async () => {
            const providerOptions = {
                id: 'http://example.com/api',
                config: {
                    maxRetries: 5, // Should be overridden to 1
                    timeout: 30000,
                },
            };
            const mockResult = {
                success: true,
                message: 'Success',
            };
            mockedTestProviderConnectivity.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(app).post('/api/providers/test').send({
                providerOptions,
            });
            expect(response.status).toBe(200);
            expect(mockedLoadApiProvider).toHaveBeenCalledWith('http://example.com/api', {
                options: {
                    ...providerOptions,
                    config: {
                        maxRetries: 1, // Should be 1, not 5
                        timeout: 30000,
                    },
                },
            });
        });
    });
});
//# sourceMappingURL=providers.test.js.map