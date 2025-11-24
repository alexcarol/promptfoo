import { RedteamGraderBase } from '../base';
export declare class InsuranceNetworkMisinformationPluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:insurance:network-misinformation";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=networkMisinformation.d.ts.map