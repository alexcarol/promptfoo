import { RedteamGraderBase } from '../base';
export declare class FinancialDefamationPluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:financial:defamation";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=financialDefamation.d.ts.map