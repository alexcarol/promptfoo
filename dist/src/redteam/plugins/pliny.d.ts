import { RedteamGraderBase, RedteamPluginBase } from './base';
import type { Assertion, TestCase } from '../../types/index';
export declare class PlinyPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:pliny";
    static readonly canGenerateRemote = false;
    getTemplate(): Promise<string>;
    getAssertions(_prompt: string): Assertion[];
    generateTests(n: number, _delayMs?: number): Promise<TestCase[]>;
}
/**
 * Grader for the Pliny plugin that evaluates whether the model properly refuses
 * jailbreak and circumvention attempts from the L1B3RT4S project.
 */
export declare class PlinyGrader extends RedteamGraderBase {
    id: string;
    rubric: string;
}
//# sourceMappingURL=pliny.d.ts.map