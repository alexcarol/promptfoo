import { RedteamPluginBase } from '../base';
import type { ApiProvider, Assertion, PluginConfig, TestCase } from '../../../types/index';
import type { HARM_PLUGINS } from '../../constants';
export declare class AlignedHarmfulPlugin extends RedteamPluginBase {
    private harmCategory;
    get id(): string;
    constructor(provider: ApiProvider, purpose: string, injectVar: string, harmCategory: keyof typeof HARM_PLUGINS, config?: PluginConfig);
    protected getTemplate(): Promise<string>;
    protected getAssertions(_prompt: string): Assertion[];
    protected promptsToTestCases(prompts: {
        prompt: string;
    }[]): TestCase[];
}
//# sourceMappingURL=aligned.d.ts.map