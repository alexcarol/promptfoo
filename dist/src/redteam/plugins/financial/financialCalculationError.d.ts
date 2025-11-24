import { RedteamGraderBase } from '../base';
export declare class FinancialCalculationErrorPluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:financial:calculation-error";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=financialCalculationError.d.ts.map