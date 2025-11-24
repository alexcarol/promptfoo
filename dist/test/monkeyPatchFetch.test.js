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
const constants_1 = require("../src/constants");
const cloud_1 = require("../src/globalConfig/cloud");
const logger_1 = __importStar(require("../src/logger"));
const utils_1 = require("./util/utils");
jest.mock('../src/logger', () => ({
    __esModule: true,
    default: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
    logRequestResponse: jest.fn(),
}));
jest.mock('../src/globalConfig/cloud', () => ({
    CLOUD_API_HOST: 'https://api.promptfoo.dev',
    cloudConfig: {
        getApiKey: jest.fn(),
    },
}));
describe('monkeyPatchFetch', () => {
    let mockOriginalFetch;
    let monkeyPatchFetch;
    beforeAll(() => {
        // Mock global fetch before importing the module
        mockOriginalFetch = jest.fn();
        Object.defineProperty(global, 'fetch', {
            value: mockOriginalFetch,
            writable: true,
        });
        // Now import the module after mocking global fetch
        const module = require('../src/util/fetch/monkeyPatchFetch');
        monkeyPatchFetch = module.monkeyPatchFetch;
    });
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(cloud_1.cloudConfig.getApiKey).mockReturnValue(undefined);
        jest.mocked(logger_1.logRequestResponse).mockClear();
        mockOriginalFetch.mockClear();
    });
    it('should log successful requests and responses', async () => {
        const mockResponse = (0, utils_1.createMockResponse)({ ok: true, status: 200 });
        mockOriginalFetch.mockResolvedValue(mockResponse);
        const url = 'https://example.com/api';
        const options = {
            method: 'POST',
            body: JSON.stringify({ test: 'data' }),
            headers: { 'Content-Type': 'application/json' },
        };
        await monkeyPatchFetch(url, options);
        expect(logger_1.logRequestResponse).toHaveBeenCalledWith({
            url: url,
            requestBody: options.body,
            requestMethod: 'POST',
            response: mockResponse,
        });
    });
    it('should not log requests to excluded endpoints', async () => {
        const mockResponse = (0, utils_1.createMockResponse)({ ok: true, status: 200 });
        mockOriginalFetch.mockResolvedValue(mockResponse);
        const excludedUrls = [
            constants_1.R_ENDPOINT + '/test',
            constants_1.CONSENT_ENDPOINT + '/test',
            constants_1.EVENTS_ENDPOINT + '/test',
        ];
        for (const url of excludedUrls) {
            await monkeyPatchFetch(url);
            expect(logger_1.logRequestResponse).not.toHaveBeenCalled();
            jest.mocked(logger_1.logRequestResponse).mockClear();
        }
    });
    it('should add Authorization header for cloud API requests when token is available', async () => {
        const mockResponse = (0, utils_1.createMockResponse)({ ok: true, status: 200 });
        mockOriginalFetch.mockResolvedValue(mockResponse);
        const apiKey = 'test-api-key-123';
        jest.mocked(cloud_1.cloudConfig.getApiKey).mockReturnValue(apiKey);
        const url = cloud_1.CLOUD_API_HOST + '/api/test';
        await monkeyPatchFetch(url);
        expect(mockOriginalFetch).toHaveBeenCalledWith(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });
    });
    it('should not add Authorization header for cloud API requests when no token available', async () => {
        const mockResponse = (0, utils_1.createMockResponse)({ ok: true, status: 200 });
        mockOriginalFetch.mockResolvedValue(mockResponse);
        jest.mocked(cloud_1.cloudConfig.getApiKey).mockReturnValue(undefined);
        const url = cloud_1.CLOUD_API_HOST + '/api/test';
        await monkeyPatchFetch(url);
        expect(mockOriginalFetch).toHaveBeenCalledWith(url, {
            headers: {},
        });
    });
    it('should handle URL objects for cloud API requests', async () => {
        const mockResponse = (0, utils_1.createMockResponse)({ ok: true, status: 200 });
        mockOriginalFetch.mockResolvedValue(mockResponse);
        const apiKey = 'test-api-key-123';
        jest.mocked(cloud_1.cloudConfig.getApiKey).mockReturnValue(apiKey);
        const url = new URL('/api/test', cloud_1.CLOUD_API_HOST);
        await monkeyPatchFetch(url);
        expect(mockOriginalFetch).toHaveBeenCalledWith(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });
    });
    it('should preserve existing headers when adding Authorization', async () => {
        const mockResponse = (0, utils_1.createMockResponse)({ ok: true, status: 200 });
        mockOriginalFetch.mockResolvedValue(mockResponse);
        const apiKey = 'test-api-key-123';
        jest.mocked(cloud_1.cloudConfig.getApiKey).mockReturnValue(apiKey);
        const url = cloud_1.CLOUD_API_HOST + '/api/test';
        const options = {
            headers: {
                'Content-Type': 'application/json',
                'X-Custom-Header': 'custom-value',
            },
        };
        await monkeyPatchFetch(url, options);
        expect(mockOriginalFetch).toHaveBeenCalledWith(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-Custom-Header': 'custom-value',
                Authorization: `Bearer ${apiKey}`,
            },
        });
    });
    it('should log errors with request details', async () => {
        const error = new Error('Network error');
        mockOriginalFetch.mockRejectedValue(error);
        const url = 'https://example.com/api';
        const options = {
            method: 'POST',
            body: JSON.stringify({ test: 'data' }),
        };
        await expect(monkeyPatchFetch(url, options)).rejects.toThrow('Network error');
        expect(logger_1.logRequestResponse).toHaveBeenCalledWith({
            url: url,
            requestBody: options.body,
            requestMethod: 'POST',
            response: null,
        });
        expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining('Error in fetch:'));
    });
    it('should handle connection errors with specific messaging', async () => {
        const connectionError = new TypeError('fetch failed');
        // @ts-expect-error undici error cause
        connectionError.cause = {
            stack: 'Error: connect ECONNREFUSED\n    at internalConnectMultiple',
        };
        mockOriginalFetch.mockRejectedValue(connectionError);
        const url = 'https://example.com/api';
        await expect(monkeyPatchFetch(url)).rejects.toThrow('fetch failed');
        expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringContaining('Connection error, please check your network connectivity'));
    });
    it('should not log errors for excluded endpoints', async () => {
        const error = new Error('Network error');
        mockOriginalFetch.mockRejectedValue(error);
        const url = constants_1.R_ENDPOINT + '/test';
        await expect(monkeyPatchFetch(url)).rejects.toThrow('Network error');
        expect(logger_1.logRequestResponse).not.toHaveBeenCalled();
        expect(logger_1.default.debug).not.toHaveBeenCalled();
    });
    it('should default to GET method when none provided', async () => {
        const mockResponse = (0, utils_1.createMockResponse)({ ok: true, status: 200 });
        mockOriginalFetch.mockResolvedValue(mockResponse);
        const url = 'https://example.com/api';
        await monkeyPatchFetch(url);
        expect(logger_1.logRequestResponse).toHaveBeenCalledWith({
            url: url,
            requestBody: undefined,
            requestMethod: 'GET',
            response: mockResponse,
        });
    });
});
//# sourceMappingURL=monkeyPatchFetch.test.js.map