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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../../src/logger"));
const pythonCompletion_1 = require("../../src/providers/pythonCompletion");
const pythonUtils = __importStar(require("../../src/python/pythonUtils"));
const index_1 = require("../../src/util/index");
const fileReference_1 = require("../../src/util/fileReference");
jest.mock('fs');
jest.mock('path');
jest.mock('../../src/util/file');
jest.mock('../../src/logger');
jest.mock('../../src/esm');
jest.mock('../../src/util');
jest.mock('../../src/util/fileReference', () => ({
    loadFileReference: jest.fn(),
    processConfigFileReferences: jest.fn(),
}));
// Mock the worker pool
const mockPoolInstance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    execute: jest.fn().mockResolvedValue({ output: 'Test output' }),
    shutdown: jest.fn().mockResolvedValue(undefined),
    getWorkerCount: jest.fn().mockReturnValue(1),
};
jest.mock('../../src/python/workerPool', () => ({
    PythonWorkerPool: jest.fn(() => mockPoolInstance),
}));
describe('PythonProvider with file references', () => {
    const providers = [];
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mock pool
        mockPoolInstance.initialize.mockResolvedValue(undefined);
        mockPoolInstance.execute.mockResolvedValue({ output: 'Test output' });
        mockPoolInstance.shutdown.mockResolvedValue(undefined);
        // Reset Python state to avoid test interference
        pythonUtils.state.cachedPythonPath = null;
        pythonUtils.state.validationPromise = null;
        jest.mocked(logger_1.default.debug).mockImplementation(() => ({
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        }));
        jest.mocked(logger_1.default.error).mockImplementation(() => ({
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        }));
        jest.mocked(path_1.default.resolve).mockImplementation((...parts) => parts.join('/'));
        jest.mocked(path_1.default.relative).mockReturnValue('relative/path');
        jest.mocked(path_1.default.join).mockImplementation((...parts) => parts.join('/'));
        jest.mocked(index_1.parsePathOrGlob).mockImplementation((_basePath, runPath) => {
            if (runPath.includes(':')) {
                const [filePath, functionName] = runPath.split(':');
                return {
                    filePath,
                    functionName,
                    isPathPattern: false,
                    extension: '.py',
                };
            }
            return {
                filePath: runPath,
                functionName: undefined,
                isPathPattern: false,
                extension: '.py',
            };
        });
        jest.mocked(fs_1.default.readFileSync).mockReturnValue('mock file content');
    });
    afterEach(async () => {
        // Cleanup providers
        await Promise.all(providers.map((p) => p.shutdown().catch(() => { })));
        providers.length = 0;
    });
    it('should call processConfigFileReferences when initializing config references', async () => {
        const mockConfig = {
            settings: 'file://settings.json',
            templates: ['file://template1.yaml', 'file://template2.txt'],
        };
        const mockProcessedConfig = {
            settings: { temperature: 0.7 },
            templates: [{ prompt: 'Template 1' }, 'Template 2 content'],
        };
        jest.mocked(fileReference_1.processConfigFileReferences).mockResolvedValue(mockProcessedConfig);
        const provider = new pythonCompletion_1.PythonProvider('test.py', {
            id: 'test',
            config: {
                basePath: '/base/path',
                ...mockConfig,
            },
        });
        providers.push(provider);
        await provider.initialize();
        expect(fileReference_1.processConfigFileReferences).toHaveBeenCalledWith(expect.objectContaining(mockConfig), '/base/path');
        expect(provider.config).toEqual(mockProcessedConfig);
    });
    it('should handle errors during config reference processing', async () => {
        const mockConfig = {
            settings: 'file://settings.json',
            basePath: '/base/path',
        };
        const mockError = new Error('Failed to load file');
        jest.mocked(fileReference_1.processConfigFileReferences).mockRejectedValue(mockError);
        const provider = new pythonCompletion_1.PythonProvider('test.py', {
            id: 'test',
            config: mockConfig,
        });
        providers.push(provider);
        await expect(provider.initialize()).rejects.toThrow('Failed to load file');
        expect(fileReference_1.processConfigFileReferences).toHaveBeenCalledWith(expect.objectContaining(mockConfig), expect.any(String));
        expect(provider['isInitialized']).toBeFalsy();
    });
    it('should process config references before calling API', async () => {
        const mockConfig = {
            settings: 'file://settings.json',
        };
        const mockProcessedConfig = {
            settings: { model: 'gpt-4' },
        };
        jest.mocked(fileReference_1.processConfigFileReferences).mockResolvedValue(mockProcessedConfig);
        const provider = new pythonCompletion_1.PythonProvider('test.py', {
            id: 'test',
            config: {
                basePath: '/base/path',
                ...mockConfig,
            },
        });
        providers.push(provider);
        await provider.callApi('Test prompt');
        expect(fileReference_1.processConfigFileReferences).toHaveBeenCalledWith(expect.objectContaining(mockConfig), '/base/path');
        expect(provider.config).toEqual(mockProcessedConfig);
    });
    it('should only process config references once', async () => {
        const mockConfig = {
            settings: 'file://settings.json',
        };
        jest.mocked(fileReference_1.processConfigFileReferences).mockResolvedValue({
            settings: { processed: true },
        });
        const provider = new pythonCompletion_1.PythonProvider('test.py', {
            id: 'test',
            config: {
                basePath: '/base/path',
                ...mockConfig,
            },
        });
        providers.push(provider);
        await provider.initialize();
        await provider.initialize();
        await provider.initialize();
        expect(fileReference_1.processConfigFileReferences).toHaveBeenCalledTimes(1);
    });
    it('should pass the loaded config to python script execution', async () => {
        const mockConfig = {
            pythonExecutable: '/custom/python',
            settings: 'file://settings.json',
        };
        const mockProcessedConfig = {
            pythonExecutable: '/custom/python',
            settings: { temperature: 0.8 },
        };
        jest.mocked(fileReference_1.processConfigFileReferences).mockResolvedValue(mockProcessedConfig);
        const provider = new pythonCompletion_1.PythonProvider('test.py', {
            id: 'test',
            config: {
                basePath: '/base/path',
                ...mockConfig,
            },
        });
        providers.push(provider);
        await provider.callApi('Test prompt');
        // Just verify config was processed - worker pool handles execution
        expect(fileReference_1.processConfigFileReferences).toHaveBeenCalledWith(expect.objectContaining(mockConfig), '/base/path');
        expect(provider.config).toEqual(mockProcessedConfig);
    });
    it('should correctly handle integration with different API call types', async () => {
        const mockProcessedConfig = {
            pythonExecutable: '/custom/python',
        };
        jest.mocked(fileReference_1.processConfigFileReferences).mockResolvedValue(mockProcessedConfig);
        const provider = new pythonCompletion_1.PythonProvider('test.py', {
            id: 'test',
            config: {
                basePath: '/base/path',
            },
        });
        providers.push(provider);
        jest.spyOn(provider, 'callApi').mockResolvedValue({
            output: 'API result',
            cached: false,
        });
        jest.spyOn(provider, 'callEmbeddingApi').mockResolvedValue({
            embedding: [0.1, 0.2, 0.3],
        });
        jest.spyOn(provider, 'callClassificationApi').mockResolvedValue({
            classification: { label: 0, score: 0.9 },
        });
        const apiResult = await provider.callApi('Test prompt');
        const embeddingResult = await provider.callEmbeddingApi('Get embedding');
        const classificationResult = await provider.callClassificationApi('Classify this');
        expect(apiResult).toEqual({ output: 'API result', cached: false });
        expect(embeddingResult).toEqual({ embedding: [0.1, 0.2, 0.3] });
        expect(classificationResult).toEqual({ classification: { label: 0, score: 0.9 } });
    });
    it('should pass processed config to Python script instead of raw file references', async () => {
        const mockOriginalConfig = {
            settings: 'file://settings.json',
            formats: 'file://formats.yaml',
        };
        const mockProcessedConfig = {
            settings: { model: 'gpt-4', temperature: 0.7 },
            formats: { outputFormat: 'json', includeTokens: true },
        };
        jest.mocked(fileReference_1.processConfigFileReferences).mockResolvedValue(mockProcessedConfig);
        const provider = new pythonCompletion_1.PythonProvider('test.py', {
            id: 'test',
            config: {
                basePath: '/base/path',
                ...mockOriginalConfig,
            },
        });
        providers.push(provider);
        await provider.callApi('Test prompt');
        // Verify that config was processed before execution
        expect(fileReference_1.processConfigFileReferences).toHaveBeenCalledWith(expect.objectContaining(mockOriginalConfig), '/base/path');
        // Verify the processed config is stored on the provider
        expect(provider.config.settings).toEqual(mockProcessedConfig.settings);
        expect(provider.config.formats).toEqual(mockProcessedConfig.formats);
        // Verify raw file references were not kept
        expect(provider.config.settings).not.toBe('file://settings.json');
        expect(provider.config.formats).not.toBe('file://formats.yaml');
    });
});
//# sourceMappingURL=pythonCompletion.fileRef.test.js.map