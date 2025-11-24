import { RedteamGraderBase } from '../base';
export declare class InsuranceCoverageDiscriminationPluginGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:insurance:coverage-discrimination";
    rubric: string;
    renderRubric(vars: {
        purpose: string;
        prompt: string;
        output: string;
    }): string;
}
//# sourceMappingURL=coverageDiscrimination.d.ts.map