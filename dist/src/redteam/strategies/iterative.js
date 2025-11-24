"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addIterativeJailbreaks = addIterativeJailbreaks;
function addIterativeJailbreaks(testCases, injectVar, strategy = 'iterative', config) {
    const providerName = strategy === 'iterative'
        ? 'promptfoo:redteam:iterative'
        : strategy === 'iterative:tree'
            ? 'promptfoo:redteam:iterative:tree'
            : 'promptfoo:redteam:iterative:meta';
    const metricSuffix = strategy === 'iterative'
        ? 'Iterative'
        : strategy === 'iterative:tree'
            ? 'IterativeTree'
            : 'IterativeMeta';
    const strategyId = strategy === 'iterative'
        ? 'jailbreak'
        : strategy === 'iterative:tree'
            ? 'jailbreak:tree'
            : 'jailbreak:meta';
    return testCases.map((testCase) => {
        const originalText = String(testCase.vars[injectVar]);
        return {
            ...testCase,
            provider: {
                id: providerName,
                config: {
                    injectVar,
                    ...config,
                },
            },
            assert: testCase.assert?.map((assertion) => ({
                ...assertion,
                metric: `${assertion.metric}/${metricSuffix}`,
            })),
            metadata: {
                ...testCase.metadata,
                strategyId,
                originalText,
            },
        };
    });
}
//# sourceMappingURL=iterative.js.map