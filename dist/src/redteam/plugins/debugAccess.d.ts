import { RedteamGraderBase, RedteamPluginBase } from './base';
import type { Assertion } from '../../types/index';
export declare class DebugAccessPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:debug-access";
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
}
export declare class DebugAccessGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:debug-access";
    rubric: string;
}
//# sourceMappingURL=debugAccess.d.ts.map