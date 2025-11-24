import { RedteamGraderBase } from '../base';
export declare class InsurancePhiDisclosurePluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:insurance:phi-disclosure";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=phiDisclosure.d.ts.map