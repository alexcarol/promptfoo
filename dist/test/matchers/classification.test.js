"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matchers_1 = require("../../src/matchers");
const huggingface_1 = require("../../src/providers/huggingface");
describe('matchesClassification', () => {
    class TestGrader {
        async callApi() {
            throw new Error('Not implemented');
        }
        async callClassificationApi() {
            return {
                classification: {
                    classA: 0.6,
                    classB: 0.5,
                },
            };
        }
        id() {
            return 'TestClassificationProvider';
        }
    }
    it('should pass when the classification score is above the threshold', async () => {
        const expected = 'classA';
        const output = 'Sample output';
        const threshold = 0.5;
        const grader = new TestGrader();
        const grading = {
            provider: grader,
        };
        await expect((0, matchers_1.matchesClassification)(expected, output, threshold, grading)).resolves.toEqual({
            pass: true,
            reason: `Classification ${expected} has score 0.60 >= ${threshold}`,
            score: 0.6,
        });
    });
    it('should fail when the classification score is below the threshold', async () => {
        const expected = 'classA';
        const output = 'Different output';
        const threshold = 0.9;
        const grader = new TestGrader();
        const grading = {
            provider: grader,
        };
        await expect((0, matchers_1.matchesClassification)(expected, output, threshold, grading)).resolves.toEqual({
            pass: false,
            reason: `Classification ${expected} has score 0.60 < ${threshold}`,
            score: 0.6,
        });
    });
    it('should pass when the maximum classification score is above the threshold with undefined expected', async () => {
        const expected = undefined;
        const output = 'Sample output';
        const threshold = 0.55;
        const grader = new TestGrader();
        const grading = {
            provider: grader,
        };
        await expect((0, matchers_1.matchesClassification)(expected, output, threshold, grading)).resolves.toEqual({
            pass: true,
            reason: `Maximum classification score 0.60 >= ${threshold}`,
            score: 0.6,
        });
    });
    it('should use the overridden classification grading config', async () => {
        const expected = 'classA';
        const output = 'Sample output';
        const threshold = 0.5;
        const grading = {
            provider: {
                id: 'hf:text-classification:foobar',
            },
        };
        const mockCallApi = jest.spyOn(huggingface_1.HuggingfaceTextClassificationProvider.prototype, 'callClassificationApi');
        mockCallApi.mockImplementation(function () {
            return Promise.resolve({
                classification: { [expected]: 0.6 },
            });
        });
        await expect((0, matchers_1.matchesClassification)(expected, output, threshold, grading)).resolves.toEqual({
            pass: true,
            reason: `Classification ${expected} has score 0.60 >= ${threshold}`,
            score: 0.6,
        });
        expect(mockCallApi).toHaveBeenCalledWith('Sample output');
        mockCallApi.mockRestore();
    });
});
//# sourceMappingURL=classification.test.js.map