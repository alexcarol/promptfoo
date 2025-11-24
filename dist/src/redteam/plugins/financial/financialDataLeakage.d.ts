import { RedteamGraderBase } from '../base';
export declare class FinancialDataLeakagePluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:financial:data-leakage";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=financialDataLeakage.d.ts.map