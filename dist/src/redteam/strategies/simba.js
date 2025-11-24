"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSimbaTestCases = addSimbaTestCases;
const logger_1 = __importDefault(require("../../logger"));
const constants_1 = require("../constants");
async function addSimbaTestCases(testCases, injectVar, config) {
    logger_1.default.debug(`Adding ${constants_1.strategyDisplayNames.simba} test cases`);
    // Simba strategy creates only a single test case, regardless of input
    if (testCases.length === 0) {
        return [];
    }
    // Take the first test case as the base and create a single Simba test case
    const baseTestCase = testCases[0];
    const originalText = String(baseTestCase.vars[injectVar]);
    return [
        {
            ...baseTestCase,
            provider: {
                id: 'promptfoo:redteam:simba',
                config: {
                    injectVar,
                    ...config,
                },
            },
            assert: baseTestCase.assert?.map((assertion) => ({
                ...assertion,
                ...(assertion.metric ? { metric: `${assertion.metric}/simba` } : {}),
            })),
            metadata: {
                ...baseTestCase.metadata,
                strategyId: 'simba',
                originalText,
            },
        },
    ];
}
//# sourceMappingURL=simba.js.map