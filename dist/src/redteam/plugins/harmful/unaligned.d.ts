import type { PluginActionParams, TestCase } from '../../../types/index';
import type { UNALIGNED_PROVIDER_HARM_PLUGINS } from '../../constants';
export declare function getHarmfulTests({ purpose, injectVar, n, delayMs, config }: PluginActionParams, plugin: keyof typeof UNALIGNED_PROVIDER_HARM_PLUGINS): Promise<TestCase[]>;
//# sourceMappingURL=unaligned.d.ts.map