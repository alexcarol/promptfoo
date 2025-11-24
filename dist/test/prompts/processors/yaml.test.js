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
const logger_1 = __importDefault(require("../../../src/logger"));
const yaml_1 = require("../../../src/prompts/processors/yaml");
const fileModule = __importStar(require("../../../src/util/file"));
jest.mock('fs');
jest.mock('../../../src/util/file');
describe('processYamlFile', () => {
    const mockReadFileSync = jest.mocked(fs.readFileSync);
    const mockMaybeLoadConfigFromExternalFile = jest.mocked(fileModule.maybeLoadConfigFromExternalFile);
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(logger_1.default.debug).mockClear();
        // By default, maybeLoadConfigFromExternalFile returns its input unchanged
        mockMaybeLoadConfigFromExternalFile.mockImplementation((input) => input);
    });
    it('should process a valid YAML file without a label', () => {
        const filePath = 'file.yaml';
        const fileContent = 'key: value';
        mockReadFileSync.mockReturnValue(fileContent);
        expect((0, yaml_1.processYamlFile)(filePath, {})).toEqual([
            {
                raw: JSON.stringify({ key: 'value' }),
                label: `${filePath}: ${JSON.stringify({ key: 'value' })}`,
                config: undefined,
            },
        ]);
        expect(mockReadFileSync).toHaveBeenCalledWith(filePath, 'utf8');
    });
    it('should process a valid YAML file with a label', () => {
        const filePath = 'file.yaml';
        const fileContent = 'key: value';
        mockReadFileSync.mockReturnValue(fileContent);
        expect((0, yaml_1.processYamlFile)(filePath, { label: 'Label' })).toEqual([
            {
                raw: JSON.stringify({ key: 'value' }),
                label: 'Label',
                config: undefined,
            },
        ]);
        expect(mockReadFileSync).toHaveBeenCalledWith(filePath, 'utf8');
    });
    it('should throw an error if the file cannot be read', () => {
        const filePath = 'nonexistent.yaml';
        mockReadFileSync.mockImplementation(() => {
            throw new Error('File not found');
        });
        expect(() => (0, yaml_1.processYamlFile)(filePath, {})).toThrow('File not found');
        expect(mockReadFileSync).toHaveBeenCalledWith(filePath, 'utf8');
    });
    it('should parse YAML and return stringified JSON', () => {
        const filePath = 'file.yaml';
        const fileContent = `
key1: value1
key2: value2
    `;
        const expectedJson = JSON.stringify({ key1: 'value1', key2: 'value2' });
        mockReadFileSync.mockReturnValue(fileContent);
        const result = (0, yaml_1.processYamlFile)(filePath, {});
        expect(result[0].raw).toBe(expectedJson);
        expect(mockReadFileSync).toHaveBeenCalledWith(filePath, 'utf8');
    });
    it('should handle YAML with nested structures', () => {
        const filePath = 'file.yaml';
        const fileContent = `
parent:
  child1: value1
  child2: value2
array:
  - item1
  - item2
    `;
        const expectedJson = JSON.stringify({
            parent: { child1: 'value1', child2: 'value2' },
            array: ['item1', 'item2'],
        });
        mockReadFileSync.mockReturnValue(fileContent);
        const result = (0, yaml_1.processYamlFile)(filePath, {});
        expect(result[0].raw).toBe(expectedJson);
    });
    it('should handle YAML with whitespace in values', () => {
        const filePath = 'file.yaml';
        const fileContent = `
key: "value with    spaces"
template: "{{ variable }}   "
    `;
        const expectedJson = JSON.stringify({
            key: 'value with    spaces',
            template: '{{ variable }}   ',
        });
        mockReadFileSync.mockReturnValue(fileContent);
        const result = (0, yaml_1.processYamlFile)(filePath, {});
        expect(result[0].raw).toBe(expectedJson);
    });
    it('should handle invalid YAML and return raw file contents', () => {
        const filePath = 'issue-2368.yaml';
        const fileContent = (0, dedent_1.default) `
    {% import "system_prompt.yaml" as system_prompt %}
    {% import "user_prompt.yaml" as user_prompt %}
    {{ system_prompt.system_prompt() }}
    {{ user_prompt.user_prompt(example) }}`;
        mockReadFileSync.mockReturnValue(fileContent);
        expect((0, yaml_1.processYamlFile)(filePath, {})).toEqual([
            {
                raw: fileContent,
                label: `${filePath}: ${fileContent.slice(0, 80)}`,
                config: undefined,
            },
        ]);
        expect(logger_1.default.debug).toHaveBeenCalledWith(expect.stringMatching(/Error parsing YAML file issue-2368\.yaml:/));
    });
    describe('recursive file:// resolution', () => {
        it('should recursively resolve file:// references in YAML content', () => {
            const filePath = 'conversation.yaml';
            const fileContent = (0, dedent_1.default) `
        - role: system
          content: file://system.md
        - role: user
          content: file://user.md
      `;
            const parsedYaml = [
                { role: 'system', content: 'file://system.md' },
                { role: 'user', content: 'file://user.md' },
            ];
            const resolvedContent = [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'What is 2 + 2?' },
            ];
            mockReadFileSync.mockReturnValue(fileContent);
            mockMaybeLoadConfigFromExternalFile.mockReturnValue(resolvedContent);
            const result = (0, yaml_1.processYamlFile)(filePath, {});
            expect(mockMaybeLoadConfigFromExternalFile).toHaveBeenCalledWith(parsedYaml);
            expect(result[0].raw).toBe(JSON.stringify(resolvedContent));
        });
        it('should handle nested file:// references in complex structures', () => {
            const filePath = 'config.yaml';
            const fileContent = (0, dedent_1.default) `
        provider:
          id: openai:gpt-4
          config:
            temperature: file://temperature.json
            tools: file://tools.yaml
        messages:
          - role: system
            content: file://system.txt
      `;
            const parsedYaml = {
                provider: {
                    id: 'openai:gpt-4',
                    config: {
                        temperature: 'file://temperature.json',
                        tools: 'file://tools.yaml',
                    },
                },
                messages: [{ role: 'system', content: 'file://system.txt' }],
            };
            const resolvedContent = {
                provider: {
                    id: 'openai:gpt-4',
                    config: {
                        temperature: 0.7,
                        tools: [{ name: 'search', description: 'Search the web' }],
                    },
                },
                messages: [{ role: 'system', content: 'You are a helpful assistant.' }],
            };
            mockReadFileSync.mockReturnValue(fileContent);
            mockMaybeLoadConfigFromExternalFile.mockReturnValue(resolvedContent);
            const result = (0, yaml_1.processYamlFile)(filePath, {});
            expect(mockMaybeLoadConfigFromExternalFile).toHaveBeenCalledWith(parsedYaml);
            expect(result[0].raw).toBe(JSON.stringify(resolvedContent));
        });
        it('should handle when maybeLoadConfigFromExternalFile returns unchanged content', () => {
            const filePath = 'no-refs.yaml';
            const fileContent = (0, dedent_1.default) `
        key1: value1
        key2: value2
      `;
            const parsedYaml = { key1: 'value1', key2: 'value2' };
            mockReadFileSync.mockReturnValue(fileContent);
            mockMaybeLoadConfigFromExternalFile.mockReturnValue(parsedYaml);
            const result = (0, yaml_1.processYamlFile)(filePath, {});
            expect(mockMaybeLoadConfigFromExternalFile).toHaveBeenCalledWith(parsedYaml);
            expect(result[0].raw).toBe(JSON.stringify(parsedYaml));
        });
    });
});
//# sourceMappingURL=yaml.test.js.map