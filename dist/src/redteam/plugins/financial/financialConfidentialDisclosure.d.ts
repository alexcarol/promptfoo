import { RedteamGraderBase } from '../base';
export declare class FinancialConfidentialDisclosurePluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:financial:confidential-disclosure";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=financialConfidentialDisclosure.d.ts.map