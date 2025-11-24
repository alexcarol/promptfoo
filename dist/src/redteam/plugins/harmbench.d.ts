import { RedteamGraderBase, RedteamPluginBase } from './base';
import type { Assertion, TestCase } from '../../types/index';
export declare class HarmbenchPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:harmbench";
    static readonly canGenerateRemote = false;
    getTemplate(): Promise<string>;
    generateTests(n: number, _delayMs?: number): Promise<TestCase[]>;
    protected getAssertions(_prompt: string): Assertion[];
}
export declare class HarmbenchGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:harmbench";
    rubric: string;
}
//# sourceMappingURL=harmbench.d.ts.map