import { RedteamGraderBase, RedteamPluginBase } from './base';
import type { Assertion } from '../../types/index';
export declare class SqlInjectionPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:sql-injection";
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
}
export declare class SqlInjectionGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:sql-injection";
    rubric: string;
}
//# sourceMappingURL=sqlInjection.d.ts.map