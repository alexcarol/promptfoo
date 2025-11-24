import { RedteamGraderBase } from '../base';
export declare class PharmacyDosageCalculationPluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:pharmacy:dosage-calculation";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=dosageCalculation.d.ts.map