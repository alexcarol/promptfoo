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
const commander_1 = require("commander");
const yaml = __importStar(require("js-yaml"));
const accounts_1 = require("../../../src/globalConfig/accounts");
const cloud_1 = require("../../../src/globalConfig/cloud");
const logger_1 = __importDefault(require("../../../src/logger"));
const index_1 = require("../../../src/redteam/index");
const discover_1 = require("../../../src/redteam/commands/discover");
const generate_1 = require("../../../src/redteam/commands/generate");
const constants_1 = require("../../../src/redteam/constants");
const mcpTools_1 = require("../../../src/redteam/extraction/mcpTools");
const cloud_2 = require("../../../src/util/cloud");
const cloud_3 = require("../../../src/util/cloud");
const configModule = __importStar(require("../../../src/util/config/load"));
const load_1 = require("../../../src/util/config/load");
const writer_1 = require("../../../src/util/config/writer");
jest.mock('fs');
jest.mock('../../../src/redteam');
jest.mock('../../../src/telemetry');
jest.mock('uuid', () => ({
    validate: jest.fn((str) => {
        // Simple UUID validation for testing
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    }),
}));
jest.mock('../../../src/util', () => ({
    setupEnv: jest.fn(),
    printBorder: jest.fn(),
}));
jest.mock('../../../src/util/promptfooCommand', () => ({
    promptfooCommand: jest.fn().mockReturnValue('promptfoo redteam init'),
    detectInstaller: jest.fn().mockReturnValue('unknown'),
    isRunningUnderNpx: jest.fn().mockReturnValue(false),
}));
jest.mock('../../../src/util/config/load', () => ({
    combineConfigs: jest.fn(),
    resolveConfigs: jest.fn(),
    readConfig: jest.fn(),
}));
jest.mock('../../../src/redteam/extraction/mcpTools', () => ({
    extractMcpToolsInfo: jest.fn(),
}));
jest.mock('../../../src/envars', () => ({
    ...jest.requireActual('../../../src/envars'),
    getEnvBool: jest.fn().mockImplementation((key) => {
        if (key === 'PROMPTFOO_REDTEAM_ENABLE_PURPOSE_DISCOVERY_AGENT') {
            return true;
        }
        return false;
    }),
}));
jest.mock('../../../src/util/cloud', () => ({
    ...jest.requireActual('../../../src/util/cloud'),
    getConfigFromCloud: jest.fn(),
    getCloudDatabaseId: jest.fn(),
    getPluginSeverityOverridesFromCloud: jest.fn(),
    isCloudProvider: jest.fn(),
    getDefaultTeam: jest.fn().mockResolvedValue({ id: 'test-team-id', name: 'Test Team' }),
    checkCloudPermissions: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../src/util/config/writer', () => ({
    writePromptfooConfig: jest.fn(),
}));
jest.mock('../../../src/cliState', () => ({
    remote: false,
}));
jest.mock('../../../src/globalConfig/cloud', () => ({
    CloudConfig: jest.fn().mockImplementation(() => ({
        isEnabled: jest.fn().mockReturnValue(false),
        getApiHost: jest.fn().mockReturnValue('https://api.promptfoo.app'),
    })),
    cloudConfig: {
        isEnabled: jest.fn().mockReturnValue(false),
        getApiHost: jest.fn().mockReturnValue('https://api.promptfoo.app'),
    },
}));
jest.mock('../../../src/redteam/commands/discover', () => ({
    doTargetPurposeDiscovery: jest.fn(),
}));
jest.mock('../../../src/redteam/remoteGeneration', () => ({
    shouldGenerateRemote: jest.fn().mockReturnValue(false),
    neverGenerateRemote: jest.fn().mockReturnValue(false),
    getRemoteGenerationUrl: jest.fn().mockReturnValue('http://test-url'),
}));
jest.mock('../../../src/util/config/manage');
jest.mock('../../../src/globalConfig/accounts', () => ({
    getAuthor: jest.fn(),
    getUserEmail: jest.fn(),
    getUserId: jest.fn().mockReturnValue('test-id'),
}));
jest.mock('../../../src/providers', () => ({
    loadApiProviders: jest.fn().mockResolvedValue([
        {
            id: () => 'test-provider',
            callApi: jest.fn(),
            cleanup: jest.fn(),
        },
    ]),
    getProviderIds: jest.fn().mockReturnValue(['test-provider']),
}));
describe('doGenerateRedteam', () => {
    let mockProvider;
    beforeEach(() => {
        jest.clearAllMocks();
        mockProvider = {
            id: () => 'test-provider',
            callApi: jest.fn().mockResolvedValue({ output: 'test output' }),
            cleanup: jest.fn().mockResolvedValue(undefined),
        };
        jest.mocked(configModule.resolveConfigs).mockResolvedValue({
            basePath: '/mock/path',
            testSuite: {
                providers: [mockProvider],
                prompts: [],
                tests: [],
            },
            config: {
                redteam: {},
            },
        });
    });
    it('should generate redteam tests and write to output file', async () => {
        jest.mocked(configModule.combineConfigs).mockResolvedValue([
            {
                prompts: [{ raw: 'Test prompt', label: 'Test label' }],
                providers: [],
                tests: [],
            },
        ]);
        const options = {
            output: 'output.yaml',
            config: 'config.yaml',
            cache: true,
            defaultConfig: {},
            write: true,
        };
        jest.mocked(fs_1.default.readFileSync).mockReturnValue(JSON.stringify({
            prompts: [{ raw: 'Test prompt' }],
            providers: [],
            tests: [],
        }));
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
            purpose: 'Test purpose',
            entities: ['Test entity'],
            injectVar: 'input',
        });
        await (0, generate_1.doGenerateRedteam)(options);
        expect(index_1.synthesize).toHaveBeenCalledWith(expect.objectContaining({
            numTests: undefined,
            plugins: expect.any(Array),
            prompts: [],
            strategies: expect.any(Array),
        }));
        expect(writer_1.writePromptfooConfig).toHaveBeenCalledWith(expect.objectContaining({
            defaultTest: {
                metadata: {
                    purpose: 'Test purpose',
                    entities: ['Test entity'],
                },
            },
            redteam: expect.objectContaining({
                purpose: 'Test purpose',
                entities: ['Test entity'],
            }),
            tests: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
        }), 'output.yaml', expect.any(Array));
    });
    it('should write to config file when write option is true', async () => {
        const options = {
            config: 'config.yaml',
            cache: true,
            defaultConfig: {},
            write: true,
        };
        jest.mocked(fs_1.default.readFileSync).mockReturnValue(JSON.stringify({}));
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
            purpose: 'Test purpose',
            entities: [],
            injectVar: 'input',
        });
        await (0, generate_1.doGenerateRedteam)(options);
        expect(writer_1.writePromptfooConfig).toHaveBeenCalledWith(expect.objectContaining({
            defaultTest: {
                metadata: {
                    purpose: 'Test purpose',
                    entities: [],
                },
            },
            redteam: expect.objectContaining({
                purpose: 'Test purpose',
                entities: [],
            }),
            tests: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
        }), 'config.yaml', expect.any(Array));
    });
    it('should handle missing configuration file', async () => {
        const options = {
            cache: true,
            defaultConfig: {},
            write: true,
            output: 'redteam.yaml',
        };
        await (0, generate_1.doGenerateRedteam)(options);
        expect(logger_1.default.info).toHaveBeenCalledWith(expect.stringContaining("Can't generate without configuration"));
    });
    it('should use purpose when no config is provided', async () => {
        // Mock extractMcpToolsInfo to return empty string for this test
        jest.mocked(mcpTools_1.extractMcpToolsInfo).mockResolvedValue('');
        const options = {
            purpose: 'Test purpose',
            cache: true,
            defaultConfig: {},
            write: true,
            output: 'redteam.yaml',
        };
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
            purpose: 'Test purpose',
            entities: ['Test entity'],
            injectVar: 'input',
        });
        await (0, generate_1.doGenerateRedteam)(options);
        expect(index_1.synthesize).toHaveBeenCalledWith(expect.objectContaining({
            numTests: undefined,
            purpose: 'Test purpose',
            plugins: expect.any(Array),
            prompts: expect.any(Array),
            strategies: expect.any(Array),
            targetLabels: [],
            showProgressBar: true,
            testGenerationInstructions: '',
        }));
    });
    it('should properly handle numTests for both string and object-style plugins', async () => {
        jest.mocked(configModule.resolveConfigs).mockResolvedValue({
            basePath: '/mock/path',
            testSuite: {
                prompts: [{ raw: 'Test prompt', label: 'Test label' }],
                providers: [],
            },
            config: {
                redteam: {
                    numTests: 1,
                    plugins: [
                        'contracts',
                        { id: 'competitors' },
                        { id: 'overreliance', numTests: 3 },
                    ],
                    strategies: [],
                },
            },
        });
        jest.mocked(fs_1.default.readFileSync).mockReturnValue(JSON.stringify({
            prompts: [{ raw: 'Test prompt' }],
            providers: [],
            tests: [],
        }));
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
            purpose: 'Test purpose',
            entities: ['Test entity'],
            injectVar: 'input',
        });
        const options = {
            output: 'output.yaml',
            cache: true,
            defaultConfig: {},
            write: true,
            force: true,
            purpose: 'Test purpose',
            config: 'config.yaml',
        };
        await (0, generate_1.doGenerateRedteam)(options);
        expect(index_1.synthesize).toHaveBeenCalledWith(expect.objectContaining({
            numTests: 1,
            plugins: expect.arrayContaining([
                expect.objectContaining({ id: 'competitors', numTests: 1 }),
                expect.objectContaining({ id: 'contracts', numTests: 1 }),
                expect.objectContaining({ id: 'overreliance', numTests: 3 }),
            ]),
            prompts: ['Test prompt'],
            strategies: [],
        }));
    });
    it('should properly handle severity property in plugin objects', async () => {
        jest.mocked(configModule.resolveConfigs).mockResolvedValue({
            basePath: '/mock/path',
            testSuite: {
                prompts: [{ raw: 'Test prompt', label: 'Test label' }],
                providers: [],
            },
            config: {
                redteam: {
                    numTests: 5,
                    plugins: [
                        'contracts',
                        { id: 'competitors', severity: constants_1.Severity.Low },
                        { id: 'overreliance', numTests: 3, severity: constants_1.Severity.High },
                        { id: 'harmful:hate', config: { customOption: true }, severity: constants_1.Severity.Medium },
                    ],
                    strategies: [],
                },
            },
        });
        jest.mocked(fs_1.default.readFileSync).mockReturnValue(JSON.stringify({
            prompts: [{ raw: 'Test prompt' }],
            providers: [],
            tests: [],
        }));
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
            purpose: 'Test purpose',
            entities: ['Test entity'],
            injectVar: 'input',
        });
        const options = {
            output: 'output.yaml',
            cache: true,
            defaultConfig: {},
            write: true,
            force: true,
            purpose: 'Test purpose',
            config: 'config.yaml',
        };
        await (0, generate_1.doGenerateRedteam)(options);
        expect(index_1.synthesize).toHaveBeenCalledWith(expect.objectContaining({
            numTests: 5,
            plugins: expect.arrayContaining([
                expect.objectContaining({ id: 'contracts', numTests: 5 }),
                expect.objectContaining({ id: 'competitors', numTests: 5, severity: constants_1.Severity.Low }),
                expect.objectContaining({ id: 'overreliance', numTests: 3, severity: constants_1.Severity.High }),
                expect.objectContaining({
                    id: 'harmful:hate',
                    numTests: 5,
                    severity: constants_1.Severity.Medium,
                    config: { customOption: true },
                }),
            ]),
            prompts: ['Test prompt'],
            strategies: [],
        }));
    });
    it('should pass entities from redteam config to synthesize', async () => {
        jest.mocked(configModule.resolveConfigs).mockResolvedValue({
            basePath: '/mock/path',
            testSuite: {
                prompts: [{ raw: 'Test prompt', label: 'Test label' }],
                providers: [],
            },
            config: {
                redteam: {
                    entities: ['Company X', 'John Doe', 'Product Y'],
                    plugins: ['harmful:hate'],
                    strategies: [],
                },
            },
        });
        jest.mocked(fs_1.default.readFileSync).mockReturnValue(JSON.stringify({
            prompts: [{ raw: 'Test prompt' }],
            providers: [],
            tests: [],
        }));
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
            purpose: 'Test purpose',
            entities: ['Company X', 'John Doe', 'Product Y'],
            injectVar: 'input',
        });
        const options = {
            output: 'output.yaml',
            cache: true,
            defaultConfig: {},
            write: true,
            force: true,
            config: 'config.yaml',
        };
        await (0, generate_1.doGenerateRedteam)(options);
        expect(index_1.synthesize).toHaveBeenCalledWith(expect.objectContaining({
            entities: ['Company X', 'John Doe', 'Product Y'],
            plugins: expect.any(Array),
            prompts: ['Test prompt'],
            strategies: expect.any(Array),
        }));
    });
    it('should handle undefined entities in redteam config', async () => {
        jest.mocked(configModule.resolveConfigs).mockResolvedValue({
            basePath: '/mock/path',
            testSuite: {
                prompts: [{ raw: 'Test prompt', label: 'Test label' }],
                providers: [],
            },
            config: {
                redteam: {
                    plugins: ['harmful:hate'],
                    strategies: [],
                },
            },
        });
        jest.mocked(fs_1.default.readFileSync).mockReturnValue(JSON.stringify({
            prompts: [{ raw: 'Test prompt' }],
            providers: [],
            tests: [],
        }));
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
            purpose: 'Test purpose',
            entities: [],
            injectVar: 'input',
        });
        const options = {
            output: 'output.yaml',
            cache: true,
            defaultConfig: {},
            write: true,
            force: true,
            config: 'config.yaml',
        };
        await (0, generate_1.doGenerateRedteam)(options);
        expect(index_1.synthesize).toHaveBeenCalledWith(expect.objectContaining({
            plugins: [expect.objectContaining({ id: 'harmful:hate', numTests: 5 })],
            prompts: ['Test prompt'],
            strategies: [],
            abortSignal: undefined,
            delay: undefined,
            maxConcurrency: undefined,
            numTests: undefined,
        }));
    });
    it('should write entities to output config', async () => {
        jest.mocked(configModule.resolveConfigs).mockResolvedValue({
            basePath: '/mock/path',
            testSuite: {
                prompts: [{ raw: 'Test prompt', label: 'Test label' }],
                providers: [],
            },
            config: {
                redteam: {
                    entities: ['Company X', 'John Doe', 'Product Y'],
                    plugins: ['harmful:hate'],
                    strategies: [],
                },
            },
        });
        jest.mocked(fs_1.default.readFileSync).mockReturnValue(JSON.stringify({
            prompts: [{ raw: 'Test prompt' }],
            providers: [],
            tests: [],
        }));
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
            purpose: 'Test purpose',
            entities: ['Company X', 'John Doe', 'Product Y'],
            injectVar: 'input',
        });
        const options = {
            output: 'output.yaml',
            cache: true,
            defaultConfig: {},
            write: true,
            force: true,
            config: 'config.yaml',
        };
        await (0, generate_1.doGenerateRedteam)(options);
        expect(writer_1.writePromptfooConfig).toHaveBeenCalledWith(expect.objectContaining({
            redteam: expect.objectContaining({
                entities: ['Company X', 'John Doe', 'Product Y'],
            }),
            defaultTest: expect.objectContaining({
                metadata: expect.objectContaining({
                    entities: ['Company X', 'John Doe', 'Product Y'],
                }),
            }),
        }), 'output.yaml', expect.any(Array));
    });
    it('should cleanup provider after generation', async () => {
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
            purpose: 'Test purpose',
            entities: ['Test entity'],
            injectVar: 'input',
        });
        const options = {
            output: 'test-output.json',
            inRedteamRun: false,
            cache: false,
            defaultConfig: {},
            write: false,
            config: 'test-config.yaml',
        };
        await (0, generate_1.doGenerateRedteam)(options);
        expect(mockProvider.cleanup).toHaveBeenCalledWith();
    });
    it('should handle provider cleanup errors gracefully', async () => {
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
            purpose: 'Test purpose',
            entities: ['Test entity'],
            injectVar: 'input',
        });
        const options = {
            output: 'test-output.json',
            inRedteamRun: false,
            cache: false,
            defaultConfig: {},
            write: false,
            config: 'test-config.yaml',
        };
        if (mockProvider.cleanup) {
            jest.mocked(mockProvider.cleanup).mockRejectedValueOnce(new Error('Cleanup failed'));
        }
        await (0, generate_1.doGenerateRedteam)(options);
        expect(mockProvider.cleanup).toHaveBeenCalledWith();
    });
    it('should warn and not fail if no plugins are specified (uses default plugins)', async () => {
        jest.mocked(configModule.resolveConfigs).mockResolvedValue({
            basePath: '/mock/path',
            testSuite: {
                providers: [mockProvider],
                prompts: [{ raw: 'Prompt', label: 'L' }],
                tests: [],
            },
            config: {
                redteam: {},
                providers: ['test-provider'],
            },
        });
        jest.mocked(fs_1.default.readFileSync).mockReturnValue(JSON.stringify({
            prompts: [{ raw: 'Prompt' }],
            providers: [],
            tests: [],
        }));
        jest.mocked(discover_1.doTargetPurposeDiscovery).mockResolvedValue({
            purpose: 'Generated purpose',
            limitations: 'Generated limitations',
            tools: [
                {
                    name: 'search',
                    description: 'search(query: string)',
                    arguments: [{ name: 'query', description: 'query', type: 'string' }],
                },
            ],
            user: 'Generated user',
        });
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [],
            purpose: 'Generated purpose',
            entities: [],
            injectVar: 'input',
        });
        const options = {
            output: 'output.yaml',
            config: 'config.yaml',
            cache: true,
            defaultConfig: {},
            write: true,
        };
        await (0, generate_1.doGenerateRedteam)(options);
        expect(index_1.synthesize).toHaveBeenCalledWith(expect.objectContaining({
            plugins: expect.any(Array),
        }));
    });
    it('should enhance purpose with MCP tools information when available', async () => {
        const mcpToolsInfo = 'MCP Tools: tool1, tool2';
        jest.mocked(mcpTools_1.extractMcpToolsInfo).mockResolvedValue(mcpToolsInfo);
        jest.mocked(configModule.resolveConfigs).mockResolvedValue({
            basePath: '/mock/path',
            testSuite: {
                providers: [mockProvider],
                prompts: [{ raw: 'Test prompt', label: 'Test prompt' }],
                tests: [],
            },
            config: {
                redteam: {
                    purpose: 'Original purpose',
                },
            },
        });
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [],
            purpose: 'Test purpose',
            entities: [],
            injectVar: 'input',
        });
        const options = {
            output: 'output.yaml',
            config: 'config.yaml',
            cache: true,
            defaultConfig: {},
            write: true,
        };
        await (0, generate_1.doGenerateRedteam)(options);
        expect(index_1.synthesize).toHaveBeenCalledWith(expect.objectContaining({
            purpose: expect.stringContaining(mcpToolsInfo),
            testGenerationInstructions: expect.stringContaining('Generate every test case prompt as a json string'),
        }));
    });
    it('should handle MCP tools extraction errors gracefully', async () => {
        jest.mocked(mcpTools_1.extractMcpToolsInfo).mockRejectedValue(new Error('MCP tools extraction failed'));
        jest.mocked(configModule.resolveConfigs).mockResolvedValue({
            basePath: '/mock/path',
            testSuite: {
                providers: [mockProvider],
                prompts: [{ raw: 'Test prompt', label: 'Test prompt' }],
                tests: [],
            },
            config: {
                redteam: {
                    purpose: 'Original purpose',
                },
            },
        });
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [],
            purpose: 'Test purpose',
            entities: [],
            injectVar: 'input',
        });
        const options = {
            output: 'output.yaml',
            config: 'config.yaml',
            cache: true,
            defaultConfig: {},
            write: true,
        };
        await (0, generate_1.doGenerateRedteam)(options);
        expect(logger_1.default.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to extract MCP tools information'));
        expect(index_1.synthesize).toHaveBeenCalledWith(expect.objectContaining({
            purpose: 'Original purpose',
        }));
    });
    describe('header comments', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it('should include header comments with author and cloud host when available', async () => {
            jest.mocked(accounts_1.getAuthor).mockReturnValue('test@example.com');
            jest.mocked(accounts_1.getUserEmail).mockReturnValue('test@example.com');
            jest.mocked(cloud_1.cloudConfig.getApiHost).mockReturnValue('https://api.promptfoo.app');
            jest.mocked(index_1.synthesize).mockResolvedValue({
                testCases: [
                    {
                        vars: { input: 'Test input' },
                        assert: [{ type: 'equals', value: 'Test output' }],
                        metadata: { pluginId: 'redteam' },
                    },
                ],
                purpose: 'Test purpose',
                entities: [],
                injectVar: 'input',
            });
            const options = {
                output: 'output.yaml',
                cache: true,
                defaultConfig: {},
                purpose: 'Test purpose',
                write: false,
            };
            await (0, generate_1.doGenerateRedteam)(options);
            expect(writer_1.writePromptfooConfig).toHaveBeenCalledWith(expect.any(Object), 'output.yaml', expect.arrayContaining([
                expect.stringContaining('REDTEAM CONFIGURATION'),
                expect.stringContaining('Generated:'),
                expect.stringContaining('test@example.com'),
                expect.stringContaining('https://api.promptfoo.app'),
                expect.stringContaining('Test Configuration:'),
            ]));
        });
        it('should show "Not logged in" when no user email', async () => {
            jest.mocked(accounts_1.getAuthor).mockReturnValue(null);
            jest.mocked(accounts_1.getUserEmail).mockReturnValue(null);
            jest.mocked(index_1.synthesize).mockResolvedValue({
                testCases: [
                    {
                        vars: { input: 'Test input' },
                        assert: [{ type: 'equals', value: 'Test output' }],
                        metadata: { pluginId: 'redteam' },
                    },
                ],
                purpose: 'Test purpose',
                entities: [],
                injectVar: 'input',
            });
            const options = {
                output: 'output.yaml',
                cache: true,
                defaultConfig: {},
                purpose: 'Test purpose',
                write: false,
            };
            await (0, generate_1.doGenerateRedteam)(options);
            expect(writer_1.writePromptfooConfig).toHaveBeenCalledWith(expect.any(Object), 'output.yaml', expect.arrayContaining([expect.stringContaining('Not logged in')]));
        });
        it('should include different headers for updates vs new configs', async () => {
            jest.mocked(accounts_1.getAuthor).mockReturnValue('test@example.com');
            jest.mocked(accounts_1.getUserEmail).mockReturnValue('test@example.com');
            jest.mocked(fs_1.default.readFileSync).mockReturnValue(JSON.stringify({}));
            jest.mocked(index_1.synthesize).mockResolvedValue({
                testCases: [
                    {
                        vars: { input: 'Test input' },
                        assert: [{ type: 'equals', value: 'Test output' }],
                        metadata: { pluginId: 'redteam' },
                    },
                ],
                purpose: 'Test purpose',
                entities: [],
                injectVar: 'input',
            });
            const options = {
                config: 'config.yaml',
                cache: true,
                defaultConfig: {},
                write: true,
            };
            await (0, generate_1.doGenerateRedteam)(options);
            expect(writer_1.writePromptfooConfig).toHaveBeenCalledWith(expect.any(Object), 'config.yaml', expect.arrayContaining([
                expect.stringContaining('REDTEAM CONFIGURATION UPDATE'),
                expect.stringContaining('Updated:'),
                expect.stringContaining('Changes:'),
                expect.stringContaining('Added'),
            ]));
        });
        it('should include plugin and strategy information in headers', async () => {
            jest.mocked(accounts_1.getAuthor).mockReturnValue('test@example.com');
            jest.mocked(accounts_1.getUserEmail).mockReturnValue('test@example.com');
            jest.mocked(configModule.resolveConfigs).mockResolvedValue({
                basePath: '/mock/path',
                testSuite: {
                    providers: [],
                    prompts: [],
                    tests: [],
                },
                config: {
                    redteam: {
                        plugins: [{ id: 'politics' }, { id: 'bias:gender' }],
                        strategies: [{ id: 'basic' }],
                    },
                },
            });
            jest.mocked(index_1.synthesize).mockResolvedValue({
                testCases: [
                    {
                        vars: { input: 'Test input' },
                        assert: [{ type: 'equals', value: 'Test output' }],
                        metadata: { pluginId: 'redteam' },
                    },
                ],
                purpose: 'Test purpose',
                entities: [],
                injectVar: 'input',
            });
            const options = {
                output: 'output.yaml',
                config: 'config.yaml',
                cache: true,
                defaultConfig: {},
                write: false,
            };
            await (0, generate_1.doGenerateRedteam)(options);
            expect(writer_1.writePromptfooConfig).toHaveBeenCalledWith(expect.any(Object), 'output.yaml', expect.arrayContaining([
                expect.stringContaining('politics, bias:gender'),
                expect.stringContaining('basic'),
            ]));
        });
        it('should handle missing author gracefully', async () => {
            jest.mocked(accounts_1.getAuthor).mockReturnValue(null);
            jest.mocked(accounts_1.getUserEmail).mockReturnValue('test@example.com');
            jest.mocked(cloud_1.cloudConfig.getApiHost).mockReturnValue('https://api.promptfoo.app');
            jest.mocked(index_1.synthesize).mockResolvedValue({
                testCases: [
                    {
                        vars: { input: 'Test input' },
                        assert: [{ type: 'equals', value: 'Test output' }],
                        metadata: { pluginId: 'redteam' },
                    },
                ],
                purpose: 'Test purpose',
                entities: [],
                injectVar: 'input',
            });
            const options = {
                output: 'output.yaml',
                cache: true,
                defaultConfig: {},
                purpose: 'Test purpose',
                write: false,
            };
            await (0, generate_1.doGenerateRedteam)(options);
            const headerComments = jest.mocked(writer_1.writePromptfooConfig).mock.calls[0][2];
            expect(headerComments).toBeDefined();
            expect(headerComments.some((comment) => comment.includes('Author:'))).toBe(false);
            expect(headerComments.some((comment) => comment.includes('https://api.promptfoo.app'))).toBe(true);
        });
    });
    describe('checkCloudPermissions', () => {
        it('should fail when checkCloudPermissions throws an error', async () => {
            // Mock cloudConfig to be enabled
            const mockCloudConfig = {
                isEnabled: jest.fn().mockReturnValue(true),
                getApiHost: jest.fn().mockReturnValue('https://api.promptfoo.app'),
            };
            jest.mocked(cloud_1.cloudConfig).isEnabled = mockCloudConfig.isEnabled;
            // Mock checkCloudPermissions to throw an error
            const permissionError = new cloud_3.ConfigPermissionError('Permission denied: insufficient access');
            jest.mocked(cloud_3.checkCloudPermissions).mockRejectedValueOnce(permissionError);
            // Setup the test configuration
            jest.mocked(configModule.resolveConfigs).mockResolvedValue({
                basePath: '/mock/path',
                testSuite: {
                    providers: [{ id: () => 'openai:gpt-4', callApi: async () => ({}) }],
                    prompts: [{ raw: 'Test prompt', label: 'Test label' }],
                    tests: [],
                },
                config: {
                    providers: ['openai:gpt-4'],
                    redteam: {},
                },
            });
            const options = {
                output: 'output.yaml',
                config: 'config.yaml',
                cache: true,
                defaultConfig: {},
                write: true,
            };
            await expect((0, generate_1.doGenerateRedteam)(options)).rejects.toThrow('Permission denied: insufficient access');
            // Verify checkCloudPermissions was called with the correct arguments
            expect(cloud_3.checkCloudPermissions).toHaveBeenCalledWith({
                providers: ['openai:gpt-4'],
                redteam: {},
            });
            // Verify that synthesize was not called
            expect(index_1.synthesize).not.toHaveBeenCalled();
        });
        it('should call checkCloudPermissions and proceed when it succeeds', async () => {
            // Mock cloudConfig to be enabled
            const mockCloudConfig = {
                isEnabled: jest.fn().mockReturnValue(true),
                getApiHost: jest.fn().mockReturnValue('https://api.promptfoo.app'),
            };
            jest.mocked(cloud_1.cloudConfig).isEnabled = mockCloudConfig.isEnabled;
            // Mock checkCloudPermissions to succeed (resolve without throwing)
            jest.mocked(cloud_3.checkCloudPermissions).mockResolvedValueOnce(undefined);
            // Setup the test configuration
            jest.mocked(configModule.resolveConfigs).mockResolvedValue({
                basePath: '/mock/path',
                testSuite: {
                    providers: [{ id: () => 'openai:gpt-4', callApi: async () => ({}) }],
                    prompts: [{ raw: 'Test prompt', label: 'Test label' }],
                    tests: [],
                },
                config: {
                    providers: ['openai:gpt-4'],
                    redteam: {},
                },
            });
            jest.mocked(index_1.synthesize).mockResolvedValue({
                testCases: [
                    {
                        vars: { input: 'Test input' },
                        assert: [{ type: 'equals', value: 'Test output' }],
                        metadata: { pluginId: 'redteam' },
                    },
                ],
                purpose: 'Test purpose',
                entities: ['Test entity'],
                injectVar: 'input',
            });
            const options = {
                output: 'output.yaml',
                config: 'config.yaml',
                cache: true,
                defaultConfig: {},
                write: true,
                force: true,
            };
            const result = await (0, generate_1.doGenerateRedteam)(options);
            // Verify checkCloudPermissions was called
            expect(cloud_3.checkCloudPermissions).toHaveBeenCalledWith({
                providers: ['openai:gpt-4'],
                redteam: {},
            });
            // Verify that the function proceeded normally
            expect(result).not.toBeNull();
            // Verify that synthesize was called
            expect(index_1.synthesize).toHaveBeenCalled();
        });
    });
});
describe('doGenerateRedteam with external defaultTest', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(fs_1.default.existsSync).mockReturnValue(false);
        jest.mocked(fs_1.default.readFileSync).mockReturnValue('');
    });
    it('should handle string defaultTest when updating config', async () => {
        const options = {
            write: true,
            config: 'test-config.yaml',
            purpose: 'Test purpose',
            entities: ['entity1', 'entity2'],
            cache: false,
            defaultConfig: {},
        };
        const existingConfig = {
            prompts: ['Test prompt'],
            providers: ['openai:gpt-4'],
            defaultTest: 'file://external/defaultTest.yaml', // String defaultTest
        };
        jest.mocked(fs_1.default.existsSync).mockReturnValue(true);
        jest.mocked(fs_1.default.readFileSync).mockReturnValue(yaml.dump(existingConfig));
        jest.mocked(load_1.readConfig).mockResolvedValue(existingConfig);
        // Mock synthesize to return test cases
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
            purpose: 'Test purpose',
            entities: ['entity1', 'entity2'],
            injectVar: 'input',
        });
        await (0, generate_1.doGenerateRedteam)(options);
        // Check that writePromptfooConfig was called with the correct defaultTest
        expect(writer_1.writePromptfooConfig).toHaveBeenCalledWith(expect.objectContaining({
            defaultTest: expect.objectContaining({
                metadata: expect.objectContaining({
                    purpose: 'Test purpose',
                    entities: ['entity1', 'entity2'],
                }),
            }),
        }), 'test-config.yaml', expect.any(Array));
    });
    it('should merge with existing object defaultTest', async () => {
        const options = {
            write: true,
            config: 'test-config.yaml',
            purpose: 'Test purpose',
            entities: ['entity1', 'entity2'],
            cache: false,
            defaultConfig: {},
        };
        const existingConfig = {
            prompts: ['Test prompt'],
            providers: ['openai:gpt-4'],
            defaultTest: {
                assert: [{ type: 'equals', value: 'test' }],
                vars: { foo: 'bar' },
            },
        };
        jest.mocked(fs_1.default.existsSync).mockReturnValue(true);
        jest.mocked(fs_1.default.readFileSync).mockReturnValue(yaml.dump(existingConfig));
        jest.mocked(load_1.readConfig).mockResolvedValue(existingConfig);
        // Mock synthesize to return test cases
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
            purpose: 'Test purpose',
            entities: ['entity1', 'entity2'],
            injectVar: 'input',
        });
        await (0, generate_1.doGenerateRedteam)(options);
        expect(writer_1.writePromptfooConfig).toHaveBeenCalledWith(expect.objectContaining({
            defaultTest: expect.objectContaining({
                assert: [{ type: 'equals', value: 'test' }],
                vars: { foo: 'bar' },
                metadata: expect.objectContaining({
                    purpose: 'Test purpose',
                    entities: ['entity1', 'entity2'],
                }),
            }),
        }), 'test-config.yaml', expect.any(Array));
    });
    it('should handle undefined defaultTest', async () => {
        const options = {
            write: true,
            config: 'test-config.yaml',
            purpose: 'Test purpose',
            entities: ['entity1', 'entity2'],
            cache: false,
            defaultConfig: {},
        };
        const existingConfig = {
            prompts: ['Test prompt'],
            providers: ['openai:gpt-4'],
            // No defaultTest
        };
        jest.mocked(fs_1.default.existsSync).mockReturnValue(true);
        jest.mocked(fs_1.default.readFileSync).mockReturnValue(yaml.dump(existingConfig));
        jest.mocked(load_1.readConfig).mockResolvedValue(existingConfig);
        // Mock synthesize to return test cases
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [
                {
                    vars: { input: 'Test input' },
                    assert: [{ type: 'equals', value: 'Test output' }],
                    metadata: { pluginId: 'redteam' },
                },
            ],
            purpose: 'Test purpose',
            entities: ['entity1', 'entity2'],
            injectVar: 'input',
        });
        await (0, generate_1.doGenerateRedteam)(options);
        expect(writer_1.writePromptfooConfig).toHaveBeenCalledWith(expect.objectContaining({
            defaultTest: expect.objectContaining({
                metadata: expect.objectContaining({
                    purpose: 'Test purpose',
                    entities: ['entity1', 'entity2'],
                }),
            }),
        }), 'test-config.yaml', expect.any(Array));
    });
});
describe('redteam generate command with target option', () => {
    let program;
    let originalExitCode;
    let mockProvider;
    beforeEach(() => {
        jest.clearAllMocks();
        program = new commander_1.Command();
        // Add both generate and init commands to test both
        (0, generate_1.redteamGenerateCommand)(program, 'generate', {}, undefined);
        (0, generate_1.redteamGenerateCommand)(program, 'init', {}, undefined);
        originalExitCode = process.exitCode;
        process.exitCode = 0;
        mockProvider = {
            id: () => 'test-provider',
            callApi: jest.fn().mockResolvedValue({ output: 'test output' }),
            cleanup: jest.fn().mockResolvedValue(undefined),
        };
        jest.mocked(configModule.resolveConfigs).mockResolvedValue({
            basePath: '/mock/path',
            testSuite: {
                providers: [mockProvider],
                prompts: [],
                tests: [],
            },
            config: {
                redteam: {},
            },
        });
    });
    afterEach(() => {
        process.exitCode = originalExitCode;
        jest.restoreAllMocks();
    });
    it('should use target option to fetch cloud config when both config and target are UUIDs', async () => {
        const mockConfig = {
            prompts: ['Test prompt'],
            vars: {},
            providers: [{ id: 'test-provider' }],
            targets: [
                {
                    id: 'test-provider',
                },
            ],
            redteam: {
                plugins: ['harmful:hate'],
                strategies: [],
            },
        };
        jest.mocked(cloud_2.getConfigFromCloud).mockResolvedValue(mockConfig);
        // Mock fs to handle the temp file write
        jest.mocked(fs_1.default.existsSync).mockReturnValue(false);
        jest.mocked(fs_1.default.writeFileSync).mockImplementation(() => { });
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [],
            purpose: 'Test purpose',
            entities: [],
            injectVar: 'input',
        });
        const configUUID = '12345678-1234-1234-1234-123456789012';
        const targetUUID = '87654321-4321-4321-4321-210987654321';
        // Find the generate command
        const generateCommand = program.commands.find((cmd) => cmd.name() === 'generate');
        expect(generateCommand).toBeDefined();
        // Execute the command with the target option
        await generateCommand.parseAsync([
            'node',
            'test',
            '--config',
            configUUID,
            '--target',
            targetUUID,
            '--output',
            'test-output.yaml',
        ]);
        // Allow async operations to complete
        await new Promise((resolve) => setTimeout(resolve, 10));
        // Verify getConfigFromCloud was called with both config and target
        expect(cloud_2.getConfigFromCloud).toHaveBeenCalledWith(configUUID, targetUUID);
    });
    it('should handle backwards compatibility with empty targets', async () => {
        const mockConfig = {
            prompts: ['Test prompt'],
            vars: {},
            providers: [{ id: 'test-provider' }],
            targets: [], // Empty targets array
            redteam: {
                plugins: ['harmful:hate'],
                strategies: [],
            },
        };
        jest.mocked(cloud_2.getConfigFromCloud).mockResolvedValue(mockConfig);
        // Mock fs to handle the temp file write
        jest.mocked(fs_1.default.existsSync).mockReturnValue(false);
        jest.mocked(fs_1.default.writeFileSync).mockImplementation(() => { });
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [],
            purpose: 'Test purpose',
            entities: [],
            injectVar: 'input',
        });
        const configUUID = '12345678-1234-1234-1234-123456789012';
        const targetUUID = '87654321-4321-4321-4321-210987654321';
        // Find the generate command
        const generateCommand = program.commands.find((cmd) => cmd.name() === 'generate');
        await generateCommand.parseAsync([
            'node',
            'test',
            '--config',
            configUUID,
            '--target',
            targetUUID,
            '--output',
            'test-output.yaml',
        ]);
        // Verify that the target was added to the config for backwards compatibility
        expect(mockConfig.targets).toEqual([
            {
                id: `promptfoo://provider/${targetUUID}`,
                config: {},
            },
        ]);
    });
    it('should throw error when target is not a UUID but config is', async () => {
        const configUUID = '12345678-1234-1234-1234-123456789012';
        const invalidTarget = 'not-a-uuid';
        // Find the generate command
        const generateCommand = program.commands.find((cmd) => cmd.name() === 'generate');
        // Execute the command and expect it to throw
        await expect(generateCommand.parseAsync([
            'node',
            'test',
            '--config',
            configUUID,
            '--target',
            invalidTarget,
            '--output',
            'test-output.yaml',
        ])).rejects.toThrow('Invalid target ID, it must be a valid UUID');
        // Verify getConfigFromCloud was not called
        expect(cloud_2.getConfigFromCloud).not.toHaveBeenCalled();
    });
    it('should log error when target is provided with local config file', async () => {
        const configPath = 'path/to/config.yaml';
        const targetUUID = '87654321-4321-4321-4321-210987654321';
        // Mock fs.existsSync to return true for the config file
        jest.mocked(fs_1.default.existsSync).mockReturnValue(true);
        jest.mocked(fs_1.default.readFileSync).mockReturnValue(yaml.dump({
            prompts: ['Test prompt'],
            providers: [],
            tests: [],
        }));
        // Find the generate command
        const generateCommand = program.commands.find((cmd) => cmd.name() === 'generate');
        await generateCommand.parseAsync([
            'node',
            'test',
            '--config',
            configPath,
            '--target',
            targetUUID,
            '--output',
            'test-output.yaml',
        ]);
        // Should log error message
        expect(logger_1.default.error).toHaveBeenCalledWith(`Target ID (-t) can only be used when -c is used with a cloud config UUID. To use a cloud target inside of a config set the id of the target to promptfoo://provider/${targetUUID}.`);
        // Should set exit code to 1
        expect(process.exitCode).toBe(1);
        // getConfigFromCloud should not be called
        expect(cloud_2.getConfigFromCloud).not.toHaveBeenCalled();
    });
    it('should log error when target is provided without any config', async () => {
        const targetUUID = '87654321-4321-4321-4321-210987654321';
        // Find the generate command
        const generateCommand = program.commands.find((cmd) => cmd.name() === 'generate');
        await generateCommand.parseAsync([
            'node',
            'test',
            '--target',
            targetUUID,
            '--output',
            'test-output.yaml',
        ]);
        // Should log error message
        expect(logger_1.default.error).toHaveBeenCalledWith(`Target ID (-t) can only be used when -c is used with a cloud config UUID. To use a cloud target inside of a config set the id of the target to promptfoo://provider/${targetUUID}.`);
        // Should set exit code to 1
        expect(process.exitCode).toBe(1);
        // getConfigFromCloud should not be called
        expect(cloud_2.getConfigFromCloud).not.toHaveBeenCalled();
    });
    it('should accept -t/--target option in generate command', async () => {
        // Find the generate command
        const generateCommand = program.commands.find((cmd) => cmd.name() === 'generate');
        expect(generateCommand).toBeDefined();
        // Check that the -t/--target option is defined
        const targetOption = generateCommand.options.find((opt) => opt.short === '-t' || opt.long === '--target');
        expect(targetOption).toBeDefined();
        expect(targetOption?.description).toContain('Cloud provider target ID');
    });
    it('should also work with the init alias command', async () => {
        const mockConfig = {
            prompts: ['Test prompt'],
            vars: {},
            providers: [{ id: 'test-provider' }],
            targets: [
                {
                    id: 'test-provider',
                },
            ],
            redteam: {
                plugins: ['harmful:hate'],
                strategies: [],
            },
        };
        jest.mocked(cloud_2.getConfigFromCloud).mockResolvedValue(mockConfig);
        // Mock fs to handle the temp file write
        jest.mocked(fs_1.default.existsSync).mockReturnValue(false);
        jest.mocked(fs_1.default.writeFileSync).mockImplementation(() => { });
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [],
            purpose: 'Test purpose',
            entities: [],
            injectVar: 'input',
        });
        const configUUID = '12345678-1234-1234-1234-123456789012';
        const targetUUID = '87654321-4321-4321-4321-210987654321';
        // Find the init command (alias for generate)
        const initCommand = program.commands.find((cmd) => cmd.name() === 'init');
        expect(initCommand).toBeDefined();
        // Check that the -t/--target option is defined
        const targetOption = initCommand.options.find((opt) => opt.short === '-t' || opt.long === '--target');
        expect(targetOption).toBeDefined();
        // Execute the command with the target option
        await initCommand.parseAsync([
            'node',
            'test',
            '--config',
            configUUID,
            '--target',
            targetUUID,
            '--output',
            'test-output.yaml',
        ]);
        // Verify getConfigFromCloud was called with both config and target
        expect(cloud_2.getConfigFromCloud).toHaveBeenCalledWith(configUUID, targetUUID);
    });
});
//# sourceMappingURL=generate.test.js.map