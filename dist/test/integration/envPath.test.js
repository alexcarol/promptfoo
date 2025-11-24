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
const path = __importStar(require("path"));
const eval_1 = require("../../src/commands/eval");
const index_1 = require("../../src/util/index");
jest.mock('../../src/cache');
jest.mock('../../src/evaluator');
jest.mock('../../src/globalConfig/accounts');
jest.mock('../../src/migrate');
jest.mock('../../src/providers');
jest.mock('../../src/share');
jest.mock('../../src/table');
jest.mock('../../src/util', () => ({
    ...jest.requireActual('../../src/util'),
    setupEnv: jest.fn(),
}));
const mockSetupEnv = index_1.setupEnv;
describe('Integration: commandLineOptions.envPath', () => {
    let tempDir;
    let tempEnvFile;
    let tempConfigFile;
    beforeAll(() => {
        tempDir = fs_1.default.mkdtempSync(path.join(__dirname, 'test-'));
        tempEnvFile = path.join(tempDir, '.env.test');
        tempConfigFile = path.join(tempDir, 'promptfooconfig.yaml');
    });
    afterAll(() => {
        fs_1.default.rmSync(tempDir, { recursive: true });
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should load environment from config-specified envPath', async () => {
        // Create test .env file
        fs_1.default.writeFileSync(tempEnvFile, 'TEST_VAR=from_config_env');
        // Create config with commandLineOptions.envPath
        fs_1.default.writeFileSync(tempConfigFile, `
commandLineOptions:
  envPath: ${tempEnvFile}

prompts:
  - "Test prompt"

providers:
  - echo

tests:
  - vars:
      input: "test"
`);
        const cmdObj = { config: [tempConfigFile] };
        try {
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
        }
        catch {
            // Expected to fail due to mocked dependencies
        }
        // Should call setupEnv twice: once for CLI (undefined), once for config
        expect(mockSetupEnv).toHaveBeenCalledTimes(2);
        expect(mockSetupEnv).toHaveBeenNthCalledWith(1, undefined); // Phase 1: CLI
        expect(mockSetupEnv).toHaveBeenNthCalledWith(2, tempEnvFile); // Phase 2: Config
    });
    it('should prioritize CLI envPath over config envPath', async () => {
        const cliEnvFile = path.join(tempDir, '.env.cli');
        fs_1.default.writeFileSync(cliEnvFile, 'CLI_VAR=from_cli');
        fs_1.default.writeFileSync(tempEnvFile, 'CONFIG_VAR=from_config');
        fs_1.default.writeFileSync(tempConfigFile, `
commandLineOptions:
  envPath: ${tempEnvFile}

prompts:
  - "Test prompt"

providers:
  - echo

tests:
  - vars:
      input: "test"
`);
        const cmdObj = {
            config: [tempConfigFile],
            envPath: cliEnvFile,
        };
        try {
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
        }
        catch {
            // Expected to fail due to mocked dependencies
        }
        // Should only call setupEnv once with CLI envPath (config envPath ignored)
        expect(mockSetupEnv).toHaveBeenCalledTimes(1);
        expect(mockSetupEnv).toHaveBeenCalledWith(cliEnvFile);
    });
    it('should handle missing commandLineOptions section gracefully', async () => {
        fs_1.default.writeFileSync(tempConfigFile, `
prompts:
  - "Test prompt"

providers:
  - echo

tests:
  - vars:
      input: "test"
`);
        const cmdObj = { config: [tempConfigFile] };
        try {
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
        }
        catch {
            // Expected to fail due to mocked dependencies
        }
        // Should only call setupEnv once with undefined (no config envPath)
        expect(mockSetupEnv).toHaveBeenCalledTimes(1);
        expect(mockSetupEnv).toHaveBeenCalledWith(undefined);
    });
    it('should handle multiple config files and use first envPath found', async () => {
        const config1File = path.join(tempDir, 'config1.yaml');
        const config2File = path.join(tempDir, 'config2.yaml');
        const _envFile1 = path.join(tempDir, '.env1');
        const envFile2 = path.join(tempDir, '.env2');
        fs_1.default.writeFileSync(config1File, `
prompts:
  - "From config 1"
`);
        fs_1.default.writeFileSync(config2File, `
commandLineOptions:
  envPath: ${envFile2}

prompts:
  - "From config 2"

providers:
  - echo

tests:
  - vars:
      input: "test"
`);
        const cmdObj = { config: [config1File, config2File] };
        try {
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
        }
        catch {
            // Expected to fail due to mocked dependencies
        }
        // Should call setupEnv twice: CLI + first envPath found (from config2)
        expect(mockSetupEnv).toHaveBeenCalledTimes(2);
        expect(mockSetupEnv).toHaveBeenNthCalledWith(1, undefined);
        expect(mockSetupEnv).toHaveBeenNthCalledWith(2, envFile2);
    });
    it('should resolve relative envPath against the config file directory', async () => {
        const subDir = path.join(tempDir, 'sub');
        fs_1.default.mkdirSync(subDir);
        const relEnv = '.env.relative';
        const relEnvAbs = path.join(subDir, relEnv);
        fs_1.default.writeFileSync(relEnvAbs, 'REL=ok');
        const subConfig = path.join(subDir, 'promptfooconfig.yaml');
        fs_1.default.writeFileSync(subConfig, `
commandLineOptions:
  envPath: ${relEnv}

prompts:
  - "From sub config"
providers:
  - echo
tests:
  - vars: { input: "t" }
`);
        try {
            await (0, eval_1.doEval)({ config: [subConfig] }, {}, undefined, {});
        }
        catch { }
        expect(mockSetupEnv).toHaveBeenCalledTimes(2);
        expect(mockSetupEnv).toHaveBeenNthCalledWith(1, undefined);
        // Expect absolute resolved path
        expect(path.isAbsolute(mockSetupEnv.mock.calls[1][0])).toBe(true);
        expect(mockSetupEnv.mock.calls[1][0]).toBe(relEnvAbs);
    });
});
//# sourceMappingURL=envPath.test.js.map