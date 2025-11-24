"use strict";
/**
 * Output Formatting and Display
 *
 * Handles formatting and displaying scan results in various formats (JSON, pretty-print).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSpinner = createSpinner;
exports.displayScanResults = displayScanResults;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const logger_1 = __importDefault(require("../../logger"));
const formatDuration_1 = require("../../util/formatDuration");
const constants_1 = require("../../constants");
const index_1 = require("../../util/index");
const codeScan_1 = require("../../types/codeScan");
/**
 * Create spinner if appropriate for the current environment
 *
 * @param options - Options for spinner creation
 * @returns Spinner instance or undefined if spinner should not be shown
 */
function createSpinner(options) {
    const showSpinner = !options.isWebUI && !options.json && options.logLevel !== 'debug';
    if (showSpinner) {
        return (0, ora_1.default)({ text: '', color: 'green' }).start();
    }
    return undefined;
}
/**
 * Display scan results in the appropriate format
 *
 * @param response - Scan response from server
 * @param duration - Duration of scan in milliseconds
 * @param options - Output options
 */
function displayScanResults(response, duration, options) {
    if (options.json) {
        // Output full scan response to stdout for programmatic consumption
        console.log(JSON.stringify(response, null, 2));
    }
    else {
        // Pretty-print results for human consumption
        const { comments, review } = response;
        const severityCounts = (0, codeScan_1.countBySeverity)(comments || []);
        // 1. Completion message and issue summary
        (0, index_1.printBorder)();
        logger_1.default.info(`${chalk_1.default.green('✓')} Scan complete (${(0, formatDuration_1.formatDuration)(duration / 1000)})`);
        if (severityCounts.total > 0) {
            logger_1.default.info(chalk_1.default.yellow(`⚠ Found ${severityCounts.total} issue${severityCounts.total === 1 ? '' : 's'}`));
        }
        (0, index_1.printBorder)();
        // 3. Review summary - shown even when no issues
        // If no review field, check for severity="none" comment to use as review
        let reviewText = review;
        if (!reviewText && comments && comments.length > 0) {
            const noneComment = comments.find((c) => c.severity === codeScan_1.CodeScanSeverity.NONE);
            if (noneComment) {
                reviewText = noneComment.finding;
            }
        }
        if (reviewText) {
            logger_1.default.info('');
            logger_1.default.info(reviewText);
            logger_1.default.info('');
            (0, index_1.printBorder)();
        }
        // 4. Detailed findings (only show issues with valid severity)
        if (severityCounts.total > 0) {
            const validSeverities = [
                codeScan_1.CodeScanSeverity.CRITICAL,
                codeScan_1.CodeScanSeverity.HIGH,
                codeScan_1.CodeScanSeverity.MEDIUM,
                codeScan_1.CodeScanSeverity.LOW,
            ];
            const issuesWithSeverity = (comments || []).filter((c) => c.severity && validSeverities.includes(c.severity));
            // Sort by severity (descending)
            const sortedComments = [...issuesWithSeverity].sort((a, b) => {
                const rankA = a.severity ? (0, codeScan_1.getSeverityRank)(a.severity) : 0;
                const rankB = b.severity ? (0, codeScan_1.getSeverityRank)(b.severity) : 0;
                return rankB - rankA;
            });
            logger_1.default.info('');
            for (let i = 0; i < sortedComments.length; i++) {
                const comment = sortedComments[i];
                const severity = (0, codeScan_1.formatSeverity)(comment.severity);
                const location = comment.line ? `${comment.file}:${comment.line}` : comment.file || '';
                logger_1.default.info(`${severity} ${chalk_1.default.gray(location)}`);
                logger_1.default.info('');
                logger_1.default.info(comment.finding);
                if (comment.fix) {
                    logger_1.default.info('');
                    logger_1.default.info(chalk_1.default.bold('Suggested Fix:'));
                    logger_1.default.info(comment.fix);
                }
                if (comment.aiAgentPrompt) {
                    logger_1.default.info('');
                    logger_1.default.info(chalk_1.default.bold('AI Agent Prompt:'));
                    logger_1.default.info(comment.aiAgentPrompt);
                }
                // Add separator between comments (but not after the last one)
                if (i < sortedComments.length - 1) {
                    logger_1.default.info('');
                    logger_1.default.info(chalk_1.default.gray('─'.repeat(constants_1.TERMINAL_MAX_WIDTH)));
                    logger_1.default.info('');
                }
            }
            (0, index_1.printBorder)();
            // 5. Next steps (only if there are issues)
            if (options.githubPr) {
                logger_1.default.info(`» Comments posted to PR: ${chalk_1.default.cyan(options.githubPr)}`);
                (0, index_1.printBorder)();
            }
        }
    }
}
//# sourceMappingURL=output.js.map