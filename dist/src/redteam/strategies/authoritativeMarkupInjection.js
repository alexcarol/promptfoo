"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAuthoritativeMarkupInjectionTestCases = addAuthoritativeMarkupInjectionTestCases;
const logger_1 = __importDefault(require("../../logger"));
async function addAuthoritativeMarkupInjectionTestCases(testCases, injectVar, config) {
    logger_1.default.debug('Adding Authoritative Markup Injection test cases');
    return testCases.map((testCase) => {
        const originalText = String(testCase.vars[injectVar]);
        return {
            ...testCase,
            provider: {
                id: 'promptfoo:redteam:authoritative-markup-injection',
                config: {
                    injectVar,
                    ...config,
                },
            },
            assert: testCase.assert?.map((assertion) => ({
                ...assertion,
                metric: `${assertion.metric}/AuthoritativeMarkupInjection`,
            })),
            metadata: {
                ...testCase.metadata,
                strategyId: 'authoritative-markup-injection',
                originalText,
            },
        };
    });
}
//# sourceMappingURL=authoritativeMarkupInjection.js.map