"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAttackSuccessRate = calculateAttackSuccessRate;
/**
 * The Attack Success Rate (ASR) is the number of tests which failed grading divided by the
 * total number of tests.
 * @param testCount - The total number of tests.
 * @param failCount - The number of failed tests.
 * @returns The attack success rate.
 */
function calculateAttackSuccessRate(testCount, failCount) {
    return testCount > 0 ? (failCount / testCount) * 100 : 0;
}
//# sourceMappingURL=metrics.js.map