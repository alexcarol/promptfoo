import type { Assertion } from '../../types/index';
import { RedteamGraderBase, RedteamPluginBase } from './base';
export declare const DEFAULT_EXAMPLES: string;
export declare class ShellInjectionPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:shell-injection";
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
}
export declare class ShellInjectionGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:shell-injection";
    rubric: string;
}
//# sourceMappingURL=shellInjection.d.ts.map