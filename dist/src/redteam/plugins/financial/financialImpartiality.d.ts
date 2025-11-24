import { RedteamGraderBase } from '../base';
export declare class FinancialImpartialityPluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:financial:impartiality";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=financialImpartiality.d.ts.map