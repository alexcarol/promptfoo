"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addHydra = addHydra;
const uuid_1 = require("uuid");
function addHydra(testCases, injectVar, config) {
    const providerName = 'promptfoo:redteam:hydra';
    const metricSuffix = 'Hydra';
    const strategyId = 'jailbreak:hydra';
    const scanId = (0, uuid_1.v4)(); // Generate once for all tests in this scan
    return testCases.map((testCase) => {
        const originalText = String(testCase.vars[injectVar]);
        return {
            ...testCase,
            provider: {
                id: providerName,
                config: {
                    injectVar,
                    scanId,
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
//# sourceMappingURL=hydra.js.map