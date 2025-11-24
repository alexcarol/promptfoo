import { RedteamGraderBase } from '../base';
export declare class FinancialSycophancyPluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:financial:sycophancy";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=financialSycophancy.d.ts.map