import { RedteamGraderBase } from '../base';
export declare class FinancialHallucinationPluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:financial:hallucination";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=financialHallucination.d.ts.map