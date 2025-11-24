"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../../src/redteam/constants");
const index_1 = require("../../../src/redteam/plugins/index");
const bias_1 = require("../../../src/redteam/plugins/bias");
const remoteGeneration_1 = require("../../../src/redteam/remoteGeneration");
jest.mock('../../../src/redteam/remoteGeneration');
describe('Bias Plugin', () => {
    let mockProvider;
    let mockPluginParams;
    beforeEach(() => {
        mockProvider = {
            callApi: jest.fn(),
            id: jest.fn().mockReturnValue('test-provider'),
        };
        mockPluginParams = {
            provider: mockProvider,
            purpose: 'test purpose',
            injectVar: 'testVar',
            n: 3,
            config: {},
            delayMs: 0,
        };
        jest.mocked(remoteGeneration_1.neverGenerateRemote).mockReturnValue(false);
    });
    describe('remote-only behavior', () => {
        it('should return empty array when remote generation is disabled for age bias', async () => {
            jest.mocked(remoteGeneration_1.neverGenerateRemote).mockReturnValue(true);
            const agebiasPlugin = index_1.Plugins.find((p) => p.key === 'bias:age');
            expect(agebiasPlugin).toBeDefined();
            const result = await agebiasPlugin.action(mockPluginParams);
            expect(result).toEqual([]);
        });
        it('should return empty array when remote generation is disabled for disability bias', async () => {
            jest.mocked(remoteGeneration_1.neverGenerateRemote).mockReturnValue(true);
            const disabilityBiasPlugin = index_1.Plugins.find((p) => p.key === 'bias:disability');
            expect(disabilityBiasPlugin).toBeDefined();
            const result = await disabilityBiasPlugin.action(mockPluginParams);
            expect(result).toEqual([]);
        });
        it('should return empty array when remote generation is disabled for gender bias', async () => {
            jest.mocked(remoteGeneration_1.neverGenerateRemote).mockReturnValue(true);
            const genderBiasPlugin = index_1.Plugins.find((p) => p.key === 'bias:gender');
            expect(genderBiasPlugin).toBeDefined();
            const result = await genderBiasPlugin.action(mockPluginParams);
            expect(result).toEqual([]);
        });
        it('should return empty array when remote generation is disabled for race bias', async () => {
            jest.mocked(remoteGeneration_1.neverGenerateRemote).mockReturnValue(true);
            const raceBiasPlugin = index_1.Plugins.find((p) => p.key === 'bias:race');
            expect(raceBiasPlugin).toBeDefined();
            const result = await raceBiasPlugin.action(mockPluginParams);
            expect(result).toEqual([]);
        });
    });
    describe('BiasGrader', () => {
        let grader;
        beforeEach(() => {
            grader = new bias_1.BiasGrader();
        });
        it('should have correct plugin ID', () => {
            expect(grader.id).toBe('promptfoo:redteam:bias');
        });
        it('should have bias-specific rubric content', () => {
            expect(grader.rubric).toContain('bias');
            expect(grader.rubric).toContain('stereotyping');
            expect(grader.rubric).toContain('discrimination');
            expect(grader.rubric).toContain('protected characteristics');
        });
        it('should include evaluation criteria in rubric', () => {
            expect(grader.rubric).toContain('FAIL');
            expect(grader.rubric).toContain('PASS');
            expect(grader.rubric).toContain('Stereotyping');
            expect(grader.rubric).toContain('Discriminatory Language');
            expect(grader.rubric).toContain('Unfair Treatment');
        });
        it('should include guidance for avoiding false positives', () => {
            expect(grader.rubric).toContain('false positives');
            expect(grader.rubric).toContain('accessibility');
            expect(grader.rubric).toContain('accommodations');
        });
    });
    describe('Plugin Constants', () => {
        it('should include all expected bias plugin types', () => {
            expect(constants_1.BIAS_PLUGINS).toContain('bias:age');
            expect(constants_1.BIAS_PLUGINS).toContain('bias:disability');
            expect(constants_1.BIAS_PLUGINS).toContain('bias:gender');
            expect(constants_1.BIAS_PLUGINS).toContain('bias:race');
            expect(constants_1.BIAS_PLUGINS).toHaveLength(4);
        });
    });
});
//# sourceMappingURL=bias.test.js.map