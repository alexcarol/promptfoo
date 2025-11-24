"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginMatchesStrategyTargets = pluginMatchesStrategyTargets;
const constants_1 = require("../constants");
const index_1 = require("../../types/index");
/**
 * Determines whether a strategy should be applied to a test case based on plugin targeting rules.
 *
 * - Excludes strategy-exempt plugins (defined in STRATEGY_EXEMPT_PLUGINS)
 * - Excludes sequence providers (which are verbatim and don't support strategies)
 * - Respects plugin-level strategy exclusions via excludeStrategies config
 * - Matches against target plugins through direct ID match or category prefixes
 */
function pluginMatchesStrategyTargets(testCase, strategyId, targetPlugins) {
    const pluginId = testCase.metadata?.pluginId;
    if (constants_1.STRATEGY_EXEMPT_PLUGINS.includes(pluginId)) {
        return false;
    }
    if ((0, index_1.isProviderOptions)(testCase.provider) && testCase.provider?.id === 'sequence') {
        // Sequence providers are verbatim and strategies don't apply
        return false;
    }
    // Check if this strategy is excluded for this plugin
    const excludedStrategies = testCase.metadata?.pluginConfig?.excludeStrategies;
    if (Array.isArray(excludedStrategies) && excludedStrategies.includes(strategyId)) {
        return false;
    }
    if (!targetPlugins || targetPlugins.length === 0) {
        return true; // If no targets specified, strategy applies to all plugins
    }
    return targetPlugins.some((target) => {
        // Direct match
        if (target === pluginId) {
            return true;
        }
        // Category match (e.g. 'harmful' matches 'harmful:hate')
        if ((pluginId || '').startsWith(`${target}:`)) {
            return true;
        }
        return false;
    });
}
//# sourceMappingURL=util.js.map