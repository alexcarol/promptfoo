import { RedteamGraderBase } from '../base';
export declare class FinancialMisconductPluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:financial:misconduct";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=financialMisconduct.d.ts.map