import type { Assertion } from '../../types/index';
import { RedteamGraderBase, RedteamPluginBase } from './base';
export declare class HallucinationPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:hallucination";
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
}
export declare class HallucinationGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:hallucination";
    rubric: string;
}
//# sourceMappingURL=hallucination.d.ts.map