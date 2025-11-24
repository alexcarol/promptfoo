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
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const manage_1 = require("../../../src/util/config/manage");
const writer_1 = require("../../../src/util/config/writer");
jest.mock('fs');
jest.mock('os');
jest.mock('../../../src/envars', () => ({
    getEnvString: jest.fn().mockReturnValue(undefined),
}));
jest.mock('../../../src/logger', () => ({
    warn: jest.fn(),
}));
describe('config management', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(os.homedir).mockReturnValue('/home/user');
        (0, manage_1.setConfigDirectoryPath)(undefined);
    });
    describe('getConfigDirectoryPath', () => {
        it('should return default config path when no custom path set', () => {
            (0, manage_1.setConfigDirectoryPath)(undefined);
            const configPath = (0, manage_1.getConfigDirectoryPath)();
            expect(configPath).toBe(path.join('/home/user', '.promptfoo'));
        });
        it('should create directory if createIfNotExists is true', () => {
            jest.mocked(fs.existsSync).mockReturnValue(false);
            (0, manage_1.setConfigDirectoryPath)(undefined);
            (0, manage_1.getConfigDirectoryPath)(true);
            expect(fs.mkdirSync).toHaveBeenCalledWith(path.join('/home/user', '.promptfoo'), {
                recursive: true,
            });
        });
        it('should not create directory if it already exists', () => {
            jest.mocked(fs.existsSync).mockReturnValue(true);
            (0, manage_1.getConfigDirectoryPath)(true);
            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });
    });
    describe('setConfigDirectoryPath', () => {
        it('should set custom config directory path', () => {
            const customPath = '/custom/path';
            (0, manage_1.setConfigDirectoryPath)(customPath);
            const configPath = (0, manage_1.getConfigDirectoryPath)();
            expect(configPath).toBe(customPath);
        });
        it('should handle undefined path', () => {
            (0, manage_1.setConfigDirectoryPath)(undefined);
            const configPath = (0, manage_1.getConfigDirectoryPath)();
            expect(configPath).toBe(path.join('/home/user', '.promptfoo'));
        });
    });
    describe('writePromptfooConfig', () => {
        const outputPath = 'config.yaml';
        it('should write config with schema comment', () => {
            const config = {
                description: 'test config',
                prompts: ['prompt1'],
            };
            (0, writer_1.writePromptfooConfig)(config, outputPath);
            expect(fs.writeFileSync).toHaveBeenCalledWith(outputPath, `# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json\n${js_yaml_1.default.dump(config)}`);
        });
        it('should write config with header comments', () => {
            const config = {
                description: 'test config',
            };
            const headerComments = ['Comment 1', 'Comment 2'];
            (0, writer_1.writePromptfooConfig)(config, outputPath, headerComments);
            const expectedContent = `# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json\n` +
                `# Comment 1\n# Comment 2\n${js_yaml_1.default.dump(config)}`;
            expect(fs.writeFileSync).toHaveBeenCalledWith(outputPath, expectedContent);
        });
        it('should handle empty config', () => {
            const config = {};
            const result = (0, writer_1.writePromptfooConfig)(config, outputPath);
            expect(result).toEqual({});
        });
        it('should order config keys', () => {
            const config = {
                tests: ['test1'],
                description: 'desc',
                prompts: ['prompt1'],
            };
            const result = (0, writer_1.writePromptfooConfig)(config, outputPath);
            expect(Object.keys(result)[0]).toBe('description');
            expect(Object.keys(result)[1]).toBe('prompts');
            expect(Object.keys(result)[2]).toBe('tests');
        });
        it('should handle empty yaml content', () => {
            const yamlDumpSpy = jest.spyOn(js_yaml_1.default, 'dump').mockReturnValue('');
            const config = { description: 'test' };
            const result = (0, writer_1.writePromptfooConfig)(config, outputPath);
            expect(result).toEqual(config);
            expect(fs.writeFileSync).not.toHaveBeenCalled();
            yamlDumpSpy.mockRestore();
        });
    });
});
//# sourceMappingURL=manage.test.js.map