"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../src/redteam/constants");
describe('constants', () => {
    it('ALL_PLUGINS should contain all plugins sorted', () => {
        expect(constants_1.ALL_PLUGINS).toEqual([
            ...new Set([
                ...constants_1.DEFAULT_PLUGINS,
                ...constants_1.ADDITIONAL_PLUGINS,
                ...constants_1.CONFIG_REQUIRED_PLUGINS,
                ...constants_1.AGENTIC_PLUGINS,
            ]),
        ].sort());
    });
    it('should have descriptions for all risk categories', () => {
        const categories = Object.keys(constants_1.riskCategories);
        categories.forEach((category) => {
            expect(constants_1.categoryDescriptions[category]).toBeDefined();
            expect(typeof constants_1.categoryDescriptions[category]).toBe('string');
        });
    });
});
//# sourceMappingURL=constants.test.js.map