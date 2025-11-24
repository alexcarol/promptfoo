import { RedteamGraderBase } from '../base';
export declare class FinancialCounterfactualPluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:financial:counterfactual";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=financialCounterfactual.d.ts.map