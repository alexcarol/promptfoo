"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMischievousUser = addMischievousUser;
function addMischievousUser(testCases, injectVar, config) {
    return testCases.map((testCase) => ({
        ...testCase,
        provider: {
            id: 'promptfoo:redteam:mischievous-user',
            config: {
                injectVar,
                ...config,
            },
        },
        assert: testCase.assert?.map((assertion) => ({
            ...assertion,
            metric: `${assertion.metric}/MischievousUser`,
        })),
        metadata: {
            ...testCase.metadata,
            strategyId: 'mischievous-user',
        },
    }));
}
//# sourceMappingURL=mischievousUser.js.map