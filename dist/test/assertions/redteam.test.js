"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redteam_1 = require("../../src/assertions/redteam");
const index_1 = require("../../src/assertions/index");
const base_1 = require("../../src/redteam/plugins/base");
describe('handleRedteam', () => {
    it('returns the value provided to the `assertion` param if `grade.assertion` returned by `grader.getResult` is null', async () => {
        // =========================
        // ===== Setup =====
        // =========================
        const assertion = {
            type: 'promptfoo:redteam:rbac',
        };
        const prompt = 'test prompt';
        const test = {
            vars: {},
            options: {},
            assert: [],
            metadata: {
                purpose: 'foo',
            },
        };
        const logProbs = [];
        const provider = undefined;
        const providerResponse = {};
        // =========================
        // ===== Mocks =====
        // =========================
        // Mock the grader's getResult method to avoid network calls
        const mockGraderResult = {
            grade: {
                pass: true,
                score: 1,
                reason: 'Mock test result',
            },
            rubric: 'Mock rubric',
        };
        jest.spyOn(base_1.RedteamGraderBase.prototype, 'getResult').mockResolvedValue(mockGraderResult);
        // =========================
        // ===== Test =====
        // =========================
        const grade = await (0, redteam_1.handleRedteam)({
            assertion,
            baseType: (0, index_1.getAssertionBaseType)(assertion),
            assertionValueContext: {
                prompt,
                vars: {},
                test,
                logProbs,
                provider,
                providerResponse,
            },
            cost: 0,
            inverse: (0, index_1.isAssertionInverse)(assertion),
            latencyMs: 0,
            logProbs,
            output: 'test output',
            outputString: 'test output',
            prompt,
            provider: undefined,
            providerResponse,
            renderedValue: undefined,
            test,
            valueFromScript: undefined,
        });
        // =========================
        // ===== Assert =====
        // =========================
        expect(grade.assertion).toEqual({
            ...assertion,
            // The handleRedteam function adds the rubric as the value to the assertion
            value: mockGraderResult.rubric,
        });
    });
});
//# sourceMappingURL=redteam.test.js.map