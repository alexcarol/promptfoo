import { RedteamGraderBase } from '../base';
export declare class PharmacyControlledSubstanceCompliancePluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:pharmacy:controlled-substance-compliance";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=controlledSubstanceCompliance.d.ts.map