import { RedteamGraderBase } from '../base';
export declare class PharmacyDrugInteractionPluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:pharmacy:drug-interaction";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=drugInteraction.d.ts.map