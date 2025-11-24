"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const metrics_1 = require("../../src/redteam/metrics");
describe('calculateAttackSuccessRate', () => {
    it('should return 0 if there are no tests', () => {
        expect((0, metrics_1.calculateAttackSuccessRate)(0, 0)).toBe(0);
    });
    it('should return 0 if there are no failed tests', () => {
        expect((0, metrics_1.calculateAttackSuccessRate)(10, 0)).toBe(0);
    });
    it('should return 100 when all tests fail', () => {
        expect((0, metrics_1.calculateAttackSuccessRate)(10, 10)).toBe(100);
    });
    it('should return correct value when some tests fail', () => {
        expect((0, metrics_1.calculateAttackSuccessRate)(10, 5)).toBe(50);
        expect((0, metrics_1.calculateAttackSuccessRate)(10, 3)).toBe(30);
        expect((0, metrics_1.calculateAttackSuccessRate)(10, 7)).toBe(70);
        expect((0, metrics_1.calculateAttackSuccessRate)(10, 1)).toBe(10);
        expect((0, metrics_1.calculateAttackSuccessRate)(10, 9)).toBe(90);
    });
});
//# sourceMappingURL=metrics.test.js.map