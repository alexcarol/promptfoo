import { RedteamGraderBase, RedteamPluginBase } from './base';
import type { Assertion } from '../../types/index';
export declare class ToolDiscoveryPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:tool-discovery";
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
}
export declare class ToolDiscoveryGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:tool-discovery";
    rubric: string;
}
//# sourceMappingURL=toolDiscovery.d.ts.map