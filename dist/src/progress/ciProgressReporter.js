"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CIProgressReporter = void 0;
const logger_1 = __importDefault(require("../logger"));
class CIProgressReporter {
    constructor(totalTests, updateIntervalMs = 30000) {
        this.completedTests = 0;
        this.intervalId = null;
        this.milestonesSeen = new Set();
        this.highestPercentageSeen = 0;
        this.lastErrorTime = 0;
        this.ERROR_THROTTLE_MS = 5000; // 5 seconds
        this.startTime = Date.now();
        this.lastUpdateTime = this.startTime;
        this.totalTests = Math.max(totalTests, 1); // Ensure at least 1 to prevent division by zero
        this.updateIntervalMs = updateIntervalMs;
    }
    start() {
        // Clear any existing interval to prevent leaks
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        logger_1.default.info(`[Evaluation] Starting ${this.totalTests} test cases...`);
        // Set up periodic updates
        this.intervalId = setInterval(() => {
            this.logPeriodicUpdate();
        }, this.updateIntervalMs);
    }
    update(completed) {
        this.completedTests = completed;
        // Log milestone updates at 25%, 50%, 75%
        const percentage = Math.floor((completed / this.totalTests) * 100);
        const milestones = [25, 50, 75];
        // Only log milestones if we're progressing forward
        if (percentage > this.highestPercentageSeen) {
            this.highestPercentageSeen = percentage;
            if (milestones.includes(percentage) && !this.milestonesSeen.has(percentage)) {
                this.milestonesSeen.add(percentage);
                this.logMilestone(percentage);
            }
        }
    }
    updateTotalTests(newTotal) {
        this.totalTests = Math.max(newTotal, 1);
        // Recalculate percentage with new total
        const percentage = Math.floor((this.completedTests / this.totalTests) * 100);
        this.highestPercentageSeen = percentage;
    }
    finish() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        const elapsed = this.formatElapsedTime(Date.now() - this.startTime);
        logger_1.default.info(`[Evaluation] ✓ Complete! ${this.completedTests}/${this.totalTests} tests in ${elapsed}`);
        // GitHub Actions specific output
        if (process.env.GITHUB_ACTIONS) {
            console.log(`::notice::Evaluation completed: ${this.completedTests}/${this.totalTests} tests in ${elapsed}`);
        }
    }
    error(message) {
        // Throttle rapid errors to prevent log spam
        const now = Date.now();
        if (now - this.lastErrorTime < this.ERROR_THROTTLE_MS) {
            return;
        }
        this.lastErrorTime = now;
        logger_1.default.error(`[Evaluation Error] ${message}`);
        if (process.env.GITHUB_ACTIONS) {
            // Escape special characters for GitHub Actions
            const escapedMessage = message.replace(/\r?\n/g, ' ').replace(/::/g, ' ');
            console.log(`::error::${escapedMessage}`);
        }
    }
    logPeriodicUpdate() {
        if (this.completedTests === 0 || this.completedTests === this.totalTests) {
            return;
        }
        const elapsed = Math.max(Date.now() - this.startTime, 1000); // Minimum 1 second
        const rate = this.completedTests / (elapsed / 1000 / 60); // tests per minute
        const remaining = this.totalTests - this.completedTests;
        // Prevent division by very small rates and handle edge cases
        let etaDisplay;
        if (rate < 0.1) {
            // Less than 0.1 tests per minute
            etaDisplay = 'calculating...';
        }
        else {
            const eta = remaining / rate;
            if (eta > 1440) {
                // More than 24 hours
                etaDisplay = '>24 hours';
            }
            else {
                etaDisplay = `${Math.round(eta)} minute${Math.round(eta) !== 1 ? 's' : ''}`;
            }
        }
        const percentage = Math.floor((this.completedTests / this.totalTests) * 100);
        logger_1.default.info(`[CI Progress] Evaluation running for ${this.formatElapsedTime(elapsed)} - ` +
            `Completed ${this.completedTests}/${this.totalTests} tests (${percentage}%)`);
        logger_1.default.info(`[CI Progress] Rate: ~${Math.round(rate)} tests/minute, ` + `ETA: ${etaDisplay}`);
    }
    logMilestone(percentage) {
        const elapsed = this.formatElapsedTime(Date.now() - this.startTime);
        logger_1.default.info(`[Evaluation] ✓ ${percentage}% complete (${this.completedTests}/${this.totalTests}) - ${elapsed} elapsed`);
        // GitHub Actions annotation
        if (process.env.GITHUB_ACTIONS) {
            console.log(`::notice::Evaluation ${percentage}% complete`);
        }
    }
    formatElapsedTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes === 0) {
            return `${seconds}s`;
        }
        return `${minutes}m ${remainingSeconds}s`;
    }
}
exports.CIProgressReporter = CIProgressReporter;
//# sourceMappingURL=ciProgressReporter.js.map