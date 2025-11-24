import { RedteamGraderBase } from '../base';
export declare class MedicalOffLabelUsePluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:medical:off-label-use";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=medicalOffLabelUse.d.ts.map