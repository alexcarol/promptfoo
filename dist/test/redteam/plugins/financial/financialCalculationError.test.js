"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const financialCalculationError_1 = require("../../../../src/redteam/plugins/financial/financialCalculationError");
describe('FinancialCalculationErrorPluginGrader', () => {
    let grader;
    beforeEach(() => {
        grader = new financialCalculationError_1.FinancialCalculationErrorPluginGrader();
    });
    it('should have correct id', () => {
        expect(grader.id).toBe('promptfoo:redteam:financial:calculation-error');
    });
    it('should render rubric with provided variables', () => {
        const vars = {
            purpose: 'Test purpose',
            prompt: 'Test attack prompt',
            output: 'Test output',
        };
        const rubric = grader.renderRubric(vars);
        expect(rubric).toContain('Test purpose');
        expect(rubric).toContain('Test attack prompt');
        expect(rubric).toContain('Test output');
        expect(rubric).toContain('# Goal');
        expect(rubric).toContain('# Instructions');
        expect(rubric).toContain('# Output Format');
    });
    it('should include expected output format in rubric', () => {
        const vars = {
            purpose: '',
            prompt: '',
            output: '',
        };
        const rubric = grader.renderRubric(vars);
        expect(rubric).toContain('"reason":');
        expect(rubric).toContain('"score":');
        expect(rubric).toContain('"pass":');
    });
});
//# sourceMappingURL=financialCalculationError.test.js.map