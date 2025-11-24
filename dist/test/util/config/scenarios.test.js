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
const glob_1 = require("glob");
const js_yaml_1 = __importDefault(require("js-yaml"));
const validateAssertions_1 = require("../../../src/assertions/validateAssertions");
const cliState_1 = __importDefault(require("../../../src/cliState"));
const index_1 = require("../../../src/prompts/index");
const index_2 = require("../../../src/providers/index");
const index_3 = require("../../../src/util/index");
// Import after mocking
const load_1 = require("../../../src/util/config/load");
const file_1 = require("../../../src/util/file");
const testCaseReader_1 = require("../../../src/util/testCaseReader");
jest.mock('fs');
jest.mock('glob', () => ({
    globSync: jest.fn(),
    hasMagic: jest.fn((pattern) => {
        const p = Array.isArray(pattern) ? pattern.join('') : pattern;
        return p.includes('*') || p.includes('?') || p.includes('[') || p.includes('{');
    }),
}));
// Mock all the dependencies first
jest.mock('../../../src/util/file', () => ({
    ...jest.requireActual('../../../src/util/file'),
    maybeLoadFromExternalFile: jest.fn(),
}));
jest.mock('../../../src/prompts');
jest.mock('../../../src/providers');
jest.mock('../../../src/util/testCaseReader');
jest.mock('../../../src/util', () => ({
    ...jest.requireActual('../../../src/util'),
    readFilters: jest.fn(),
}));
jest.mock('../../../src/assertions/validateAssertions');
describe('Scenario loading with glob patterns', () => {
    const originalBasePath = cliState_1.default.basePath;
    beforeEach(() => {
        jest.clearAllMocks();
        cliState_1.default.basePath = '/test/path';
        // Setup default mocks
        jest.mocked(index_1.readPrompts).mockResolvedValue([{ raw: 'Test prompt', label: 'Test prompt' }]);
        jest.mocked(index_1.readProviderPromptMap).mockReturnValue({});
        jest
            .mocked(index_2.loadApiProviders)
            .mockResolvedValue([{ id: () => 'openai:gpt-3.5-turbo', callApi: jest.fn() }]);
        jest.mocked(testCaseReader_1.readTests).mockResolvedValue([]);
        jest.mocked(index_3.readFilters).mockResolvedValue({});
        jest.mocked(validateAssertions_1.validateAssertions).mockImplementation(() => { });
    });
    afterEach(() => {
        cliState_1.default.basePath = originalBasePath;
    });
    it('should flatten scenarios when loaded with glob patterns', async () => {
        const scenario1 = {
            description: 'Scenario 1',
            config: [{ vars: { name: 'Alice' } }],
            tests: [{ vars: { question: 'Test 1' } }],
        };
        const scenario2 = {
            description: 'Scenario 2',
            config: [{ vars: { name: 'Bob' } }],
            tests: [{ vars: { question: 'Test 2' } }],
        };
        // Mock file system
        jest.mocked(fs.existsSync).mockReturnValue(true);
        jest.mocked(fs.readFileSync).mockImplementation((filePath) => {
            if (filePath === 'config.yaml') {
                return js_yaml_1.default.dump({
                    prompts: ['Test prompt'],
                    providers: ['openai:gpt-3.5-turbo'],
                    scenarios: ['file://scenarios/*.yaml'],
                });
            }
            return '';
        });
        // Mock glob to return config file
        jest.mocked(glob_1.globSync).mockReturnValue(['config.yaml']);
        // Mock maybeLoadFromExternalFile to return nested array (simulating glob expansion)
        jest.mocked(file_1.maybeLoadFromExternalFile).mockImplementation((input) => {
            if (Array.isArray(input) && input[0] === 'file://scenarios/*.yaml') {
                // Return nested array as would happen with glob pattern
                return [[scenario1, scenario2]];
            }
            return input;
        });
        const cmdObj = { config: ['config.yaml'] };
        const defaultConfig = {};
        const { testSuite } = await (0, load_1.resolveConfigs)(cmdObj, defaultConfig);
        // Check if maybeLoadFromExternalFile was called with the expected argument
        expect(file_1.maybeLoadFromExternalFile).toHaveBeenCalledWith(['file://scenarios/*.yaml']);
        // Verify scenarios are flattened correctly
        expect(testSuite.scenarios).toHaveLength(2);
        expect(testSuite.scenarios[0]).toEqual(scenario1);
        expect(testSuite.scenarios[1]).toEqual(scenario2);
    });
    it('should handle multiple scenario files with glob patterns', async () => {
        const scenarios = [
            {
                description: 'Scenario A',
                config: [{ vars: { test: 'A' } }],
                tests: [{ vars: { input: '1' } }],
            },
            {
                description: 'Scenario B',
                config: [{ vars: { test: 'B' } }],
                tests: [{ vars: { input: '2' } }],
            },
            {
                description: 'Scenario C',
                config: [{ vars: { test: 'C' } }],
                tests: [{ vars: { input: '3' } }],
            },
        ];
        jest.mocked(fs.existsSync).mockReturnValue(true);
        jest.mocked(fs.readFileSync).mockImplementation((filePath) => {
            if (filePath === 'config.yaml') {
                return js_yaml_1.default.dump({
                    prompts: ['Test prompt'],
                    providers: ['openai:gpt-3.5-turbo'],
                    scenarios: ['file://group1/*.yaml', 'file://group2/*.yaml'],
                });
            }
            return '';
        });
        jest.mocked(glob_1.globSync).mockReturnValue(['config.yaml']);
        jest.mocked(file_1.maybeLoadFromExternalFile).mockImplementation((input) => {
            if (Array.isArray(input)) {
                // Simulate two glob patterns each returning different scenarios
                return [
                    [scenarios[0], scenarios[1]], // group1/*.yaml
                    [scenarios[2]], // group2/*.yaml
                ];
            }
            return input;
        });
        const cmdObj = { config: ['config.yaml'] };
        const defaultConfig = {};
        const { testSuite } = await (0, load_1.resolveConfigs)(cmdObj, defaultConfig);
        // Verify all scenarios are flattened into a single array
        expect(testSuite.scenarios).toHaveLength(3);
        expect(testSuite.scenarios).toEqual(scenarios);
    });
    it('should handle mixed scenario loading (direct and glob)', async () => {
        const directScenario = {
            description: 'Direct scenario',
            config: [{ vars: { type: 'direct' } }],
            tests: [{ vars: { test: 'direct' } }],
        };
        const globScenarios = [
            {
                description: 'Glob scenario 1',
                config: [{ vars: { type: 'glob' } }],
                tests: [{ vars: { test: 'glob1' } }],
            },
            {
                description: 'Glob scenario 2',
                config: [{ vars: { type: 'glob' } }],
                tests: [{ vars: { test: 'glob2' } }],
            },
        ];
        jest.mocked(fs.existsSync).mockReturnValue(true);
        jest.mocked(fs.readFileSync).mockImplementation((filePath) => {
            if (filePath === 'config.yaml') {
                return js_yaml_1.default.dump({
                    prompts: ['Test prompt'],
                    providers: ['openai:gpt-3.5-turbo'],
                    scenarios: [directScenario, 'file://scenarios/*.yaml'],
                });
            }
            return '';
        });
        jest.mocked(glob_1.globSync).mockReturnValue(['config.yaml']);
        jest.mocked(file_1.maybeLoadFromExternalFile).mockImplementation((input) => {
            if (Array.isArray(input)) {
                // First element is direct scenario, second is glob pattern
                return [directScenario, globScenarios];
            }
            return input;
        });
        const cmdObj = { config: ['config.yaml'] };
        const defaultConfig = {};
        const { testSuite } = await (0, load_1.resolveConfigs)(cmdObj, defaultConfig);
        // Verify mixed scenarios are flattened correctly
        expect(testSuite.scenarios).toHaveLength(3);
        expect(testSuite.scenarios[0]).toEqual(directScenario);
        expect(testSuite.scenarios[1]).toEqual(globScenarios[0]);
        expect(testSuite.scenarios[2]).toEqual(globScenarios[1]);
    });
});
//# sourceMappingURL=scenarios.test.js.map