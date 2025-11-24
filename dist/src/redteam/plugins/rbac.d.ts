import { RedteamGraderBase, RedteamPluginBase } from './base';
import type { Assertion } from '../../types/index';
export declare class RbacPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:rbac";
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
}
export declare class RbacGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:rbac";
    rubric: string;
}
//# sourceMappingURL=rbac.d.ts.map