"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ciProgressReporter_1 = require("../../src/progress/ciProgressReporter");
const logger_1 = __importDefault(require("../../src/logger"));
// Mock the logger
jest.mock('../../src/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
}));
describe('CIProgressReporter - Error Throttling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    it('should throttle rapid error messages', () => {
        const reporter = new ciProgressReporter_1.CIProgressReporter(100);
        // First error should be logged
        reporter.error('Error 1');
        expect(logger_1.default.error).toHaveBeenCalledTimes(1);
        expect(logger_1.default.error).toHaveBeenCalledWith('[Evaluation Error] Error 1');
        // Rapid errors should be throttled
        reporter.error('Error 2');
        reporter.error('Error 3');
        reporter.error('Error 4');
        // Still only 1 error logged
        expect(logger_1.default.error).toHaveBeenCalledTimes(1);
        // Advance time by 5 seconds (throttle period)
        jest.advanceTimersByTime(5000);
        // Next error should be logged
        reporter.error('Error 5');
        expect(logger_1.default.error).toHaveBeenCalledTimes(2);
        expect(logger_1.default.error).toHaveBeenLastCalledWith('[Evaluation Error] Error 5');
    });
    it('should handle errors during long-running evaluations', () => {
        const reporter = new ciProgressReporter_1.CIProgressReporter(1000, 30000);
        reporter.start();
        // Simulate long-running evaluation
        jest.advanceTimersByTime(900000); // 15 minutes
        reporter.update(500);
        // First error logged
        reporter.error('Timeout error');
        expect(logger_1.default.error).toHaveBeenCalledTimes(1);
        // Rapid subsequent errors throttled
        reporter.error('Another error');
        reporter.error('Yet another error');
        expect(logger_1.default.error).toHaveBeenCalledTimes(1);
        // Advance past throttle period
        jest.advanceTimersByTime(5000);
        reporter.error('Final error');
        expect(logger_1.default.error).toHaveBeenCalledTimes(2);
    });
});
//# sourceMappingURL=ciProgressReporter.throttling.test.js.map