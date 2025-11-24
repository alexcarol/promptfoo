"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const huggingfaceDatasets_1 = require("../../../src/integrations/huggingfaceDatasets");
const aegis_1 = require("../../../src/redteam/plugins/aegis");
const base_1 = require("../../../src/redteam/plugins/base");
jest.mock('../../../src/integrations/huggingfaceDatasets');
describe('AegisPlugin', () => {
    let plugin;
    const mockProvider = {
        id: () => 'test-provider',
        callApi: jest.fn(),
    };
    beforeEach(() => {
        plugin = new aegis_1.AegisPlugin(mockProvider, 'test-var', 'test-var');
    });
    it('should set canGenerateRemote to false', () => {
        expect(aegis_1.AegisPlugin.canGenerateRemote).toBe(false);
    });
    it('should return inject var from getTemplate', async () => {
        const template = await plugin.getTemplate();
        expect(template).toBe('test-var');
    });
    it('should return correct assertions', () => {
        const assertions = plugin.getAssertions('test prompt');
        expect(assertions).toEqual([
            {
                type: 'promptfoo:redteam:aegis',
                metric: 'Aegis',
            },
        ]);
    });
    it('should generate tests correctly', async () => {
        const mockTestCases = [
            {
                vars: {
                    text: 'test text',
                    text_type: 'user_message',
                    labels_0: 'Safe',
                },
            },
        ];
        jest.mocked(huggingfaceDatasets_1.fetchHuggingFaceDataset).mockResolvedValue(mockTestCases);
        const tests = await plugin.generateTests(1);
        expect(tests).toEqual([
            {
                vars: {
                    'test-var': 'test text',
                },
                metadata: {
                    label: 'Safe',
                },
                assert: [
                    {
                        type: 'promptfoo:redteam:aegis',
                        metric: 'Aegis',
                    },
                ],
            },
        ]);
    });
    it('should handle empty dataset', async () => {
        jest.mocked(huggingfaceDatasets_1.fetchHuggingFaceDataset).mockResolvedValue([]);
        const tests = await plugin.generateTests(1);
        expect(tests).toEqual([]);
    });
});
describe('fetchDataset', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });
    it('should fetch and filter dataset', async () => {
        const mockTestCases = [
            {
                vars: { text: 'hello', text_type: 'user_message', labels_0: 'Safe' },
            },
            { vars: { text: 'ignore me', text_type: 'llm_response' } },
        ];
        jest.mocked(huggingfaceDatasets_1.fetchHuggingFaceDataset).mockResolvedValue(mockTestCases);
        const result = await (0, aegis_1.fetchDataset)(1);
        expect(huggingfaceDatasets_1.fetchHuggingFaceDataset).toHaveBeenCalledWith(aegis_1.DATASET_PATH, 5);
        expect(result).toHaveLength(1);
        expect(result[0].vars?.text).toBe('hello');
        expect(result[0].vars?.labels_0).toBe('Safe');
    });
    it('should handle errors', async () => {
        jest.mocked(huggingfaceDatasets_1.fetchHuggingFaceDataset).mockRejectedValue(new Error('fail'));
        const result = await (0, aegis_1.fetchDataset)(2);
        expect(result).toEqual([]);
    });
    it('should handle invalid records', async () => {
        const mockTestCases = [
            { vars: { text: 'valid', text_type: 'wrong_type' } },
            { vars: { text: 'valid', text_type: 'user_message' } },
        ];
        jest.mocked(huggingfaceDatasets_1.fetchHuggingFaceDataset).mockResolvedValue(mockTestCases);
        const result = await (0, aegis_1.fetchDataset)(1);
        expect(result).toEqual([
            {
                vars: {
                    text: 'valid',
                    labels_0: '',
                },
            },
        ]);
    });
});
describe('AegisGrader', () => {
    let grader;
    beforeEach(() => {
        grader = new aegis_1.AegisGrader();
    });
    it('should have correct ID', () => {
        expect(grader.id).toBe('promptfoo:redteam:aegis');
    });
    it('should handle basic refusal', async () => {
        const output = "I'm sorry, I cannot help with that request";
        const result = await grader.getResult('test prompt', output, {}, undefined);
        expect(result).toEqual({
            grade: {
                pass: true,
                score: 1,
                reason: 'The output contains a standard refusal.',
            },
            rubric: grader.rubric,
        });
    });
    it('should use super class grading for non-refusal', async () => {
        const output = 'Here is a normal response';
        const mockSuperResult = {
            grade: { pass: true, score: 0.8, reason: 'test' },
            rubric: 'test rubric',
        };
        jest.spyOn(base_1.RedteamGraderBase.prototype, 'getResult').mockResolvedValue(mockSuperResult);
        const result = await grader.getResult('test prompt', output, {}, undefined);
        expect(result).toEqual(mockSuperResult);
    });
    it('should have correct rubric content', () => {
        expect(grader.rubric).toContain('You are a content safety evaluator');
        expect(grader.rubric).toContain('content safety guidelines');
        expect(grader.rubric).toContain('{ "pass": true }');
        expect(grader.rubric).toContain('{ "pass": false }');
    });
});
//# sourceMappingURL=aegis.test.js.map