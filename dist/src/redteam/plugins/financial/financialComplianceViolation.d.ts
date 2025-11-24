import { RedteamGraderBase } from '../base';
export declare class FinancialComplianceViolationPluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:financial:compliance-violation";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=financialComplianceViolation.d.ts.map