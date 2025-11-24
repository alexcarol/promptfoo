import { type TestCaseWithPlugin } from '../../types/index';
import type { RedteamStrategyObject } from '../types';
/**
 * Determines whether a strategy should be applied to a test case based on plugin targeting rules.
 *
 * - Excludes strategy-exempt plugins (defined in STRATEGY_EXEMPT_PLUGINS)
 * - Excludes sequence providers (which are verbatim and don't support strategies)
 * - Respects plugin-level strategy exclusions via excludeStrategies config
 * - Matches against target plugins through direct ID match or category prefixes
 */
export declare function pluginMatchesStrategyTargets(testCase: TestCaseWithPlugin, strategyId: string, targetPlugins?: NonNullable<RedteamStrategyObject['config']>['plugins']): boolean;
//# sourceMappingURL=util.d.ts.map