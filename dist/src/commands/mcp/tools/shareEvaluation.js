"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerShareEvaluationTool = registerShareEvaluationTool;
const dedent_1 = __importDefault(require("dedent"));
const zod_1 = require("zod");
const cloud_1 = require("../../../globalConfig/cloud");
const logger_1 = __importDefault(require("../../../logger"));
const eval_1 = __importDefault(require("../../../models/eval"));
const share_1 = require("../../../share");
const default_1 = require("../../../util/config/default");
const utils_1 = require("../utils");
/**
 * Share an evaluation to create a publicly accessible URL
 *
 * Use this tool to:
 * - Create shareable URLs for evaluation results
 * - Share evaluation insights with team members or stakeholders
 * - Generate links for reporting and presentations
 * - Make evaluation data accessible outside the local environment
 *
 * Features:
 * - Share specific evaluations by ID or latest evaluation
 * - Support for both cloud and self-hosted sharing
 * - Option to include or exclude authentication information
 * - Automatic handling of sharing configuration and permissions
 * - Validation that evaluations are complete and shareable
 *
 * Perfect for:
 * - Creating reports and presentations
 * - Collaborating with team members
 * - Sharing results with stakeholders
 * - Publishing evaluation insights
 */
function registerShareEvaluationTool(server) {
    server.tool('share_evaluation', {
        evalId: zod_1.z
            .string()
            .optional()
            .describe((0, dedent_1.default) `
            Specific evaluation ID to share.
            If not provided, shares the most recent evaluation.
            Example: "eval-8h1-2025-11-15T14:17:18"
          `),
        showAuth: zod_1.z
            .boolean()
            .optional()
            .default(false)
            .describe((0, dedent_1.default) `
            Whether to include authentication information in the shared URL.
            Default: false (excludes auth for security)
          `),
        overwrite: zod_1.z
            .boolean()
            .optional()
            .default(false)
            .describe((0, dedent_1.default) `
            Whether to overwrite if the evaluation has already been shared.
            Default: false (will return existing URL if already shared)
          `),
    }, async (args) => {
        try {
            const { evalId, showAuth = false, overwrite = false } = args;
            // Find the evaluation to share
            let evalRecord = undefined;
            if (evalId) {
                evalRecord = await eval_1.default.findById(evalId);
                if (!evalRecord) {
                    return (0, utils_1.createToolResponse)('share_evaluation', false, undefined, `Could not find evaluation with ID: ${evalId}. Use list_evaluations to find valid IDs.`);
                }
            }
            else {
                evalRecord = await eval_1.default.latest();
                if (!evalRecord) {
                    return (0, utils_1.createToolResponse)('share_evaluation', false, undefined, 'No evaluations found. Run an evaluation first using run_evaluation or the CLI.');
                }
            }
            // Apply sharing configuration from default config if available
            try {
                const { defaultConfig } = await (0, default_1.loadDefaultConfig)();
                if (defaultConfig && defaultConfig.sharing) {
                    evalRecord.config.sharing = defaultConfig.sharing;
                    logger_1.default.debug(`Applied sharing config: ${JSON.stringify(defaultConfig.sharing)}`);
                }
            }
            catch (err) {
                logger_1.default.debug(`Could not load sharing config: ${err}`);
            }
            // Validate that the evaluation can be shared
            if (evalRecord.prompts.length === 0) {
                return (0, utils_1.createToolResponse)('share_evaluation', false, undefined, (0, dedent_1.default) `
              Evaluation ${evalRecord.id} cannot be shared.
              This may be because:
              - The evaluation is still running
              - The evaluation did not complete successfully
              - No prompts were defined in the evaluation
              
              Wait for the evaluation to complete or check its status.
            `);
            }
            // Check if sharing is enabled
            if ((0, share_1.isSharingEnabled)(evalRecord) === false) {
                const isCloudEnabled = cloud_1.cloudConfig.isEnabled();
                return (0, utils_1.createToolResponse)('share_evaluation', false, {
                    evalId: evalRecord.id,
                    sharingEnabled: false,
                    cloudEnabled: isCloudEnabled,
                    instructions: {
                        cloudSetup: isCloudEnabled === false
                            ? [
                                'Sign up or log in at https://promptfoo.app',
                                'Follow instructions at https://promptfoo.app/welcome to login via CLI',
                                'Configure sharing in your promptfooconfig.yaml',
                            ]
                            : null,
                        configHelp: 'Enable sharing by adding "sharing: true" to your promptfooconfig.yaml',
                    },
                }, (0, dedent_1.default) `
              Sharing is not enabled for this evaluation.
              ${isCloudEnabled === false
                    ? 'You need a cloud account to share evaluations securely.'
                    : 'Check your sharing configuration in promptfooconfig.yaml.'}
            `);
            }
            // Check if evaluation has already been shared (only for cloud)
            let existingUrl = null;
            if (cloud_1.cloudConfig.isEnabled() && !overwrite) {
                const alreadyShared = await (0, share_1.hasEvalBeenShared)(evalRecord);
                if (alreadyShared && evalId) {
                    existingUrl = await (0, share_1.getShareableUrl)(evalRecord, evalId, showAuth);
                    if (existingUrl) {
                        const shareData = {
                            url: existingUrl,
                            evalId,
                            createdAt: evalRecord.createdAt,
                            description: evalRecord.description,
                            isExisting: true,
                            message: 'Evaluation already shared',
                        };
                        return (0, utils_1.createToolResponse)('share_evaluation', true, shareData);
                    }
                }
            }
            // Create new shareable URL
            logger_1.default.debug(`Creating shareable URL for evaluation ${evalRecord.id}`);
            const shareUrl = await (0, share_1.createShareableUrl)(evalRecord, showAuth);
            if (!shareUrl) {
                return (0, utils_1.createToolResponse)('share_evaluation', false, {
                    evalId: evalRecord.id,
                    error: 'Failed to create shareable URL',
                    troubleshooting: [
                        'Check internet connectivity',
                        'Verify sharing service is accessible',
                        'Check authentication credentials',
                        'Ensure evaluation data is valid',
                    ],
                }, 'Failed to create shareable URL. Check connectivity and authentication.');
            }
            // Success response with comprehensive metadata
            const shareData = {
                evalId: evalRecord.id,
                shareUrl,
                alreadyShared: false,
                sharing: {
                    showAuth,
                    cloudEnabled: cloud_1.cloudConfig.isEnabled(),
                    domain: new URL(shareUrl).hostname,
                    isPublic: !cloud_1.cloudConfig.isEnabled(),
                },
                evaluation: {
                    description: evalRecord.config.description || 'No description',
                    promptCount: evalRecord.prompts.length,
                    createdAt: evalRecord.createdAt || 'Unknown',
                    author: evalRecord.author || 'Unknown',
                },
                instructions: {
                    sharing: 'Share this URL with team members or stakeholders',
                    viewing: 'Recipients can view evaluation results in their browser',
                    collaboration: 'Use this for reports, presentations, and team collaboration',
                },
            };
            return (0, utils_1.createToolResponse)('share_evaluation', true, shareData);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            logger_1.default.error(`Share evaluation failed: ${errorMessage}`);
            const errorData = {
                evalId: args.evalId || 'latest',
                error: errorMessage,
                sharing: {
                    showAuth: args.showAuth || false,
                    cloudEnabled: cloud_1.cloudConfig.isEnabled(),
                },
                troubleshooting: {
                    commonIssues: [
                        'Network connectivity problems',
                        'Authentication/authorization issues',
                        'Invalid evaluation ID',
                        'Sharing service unavailable',
                        'Evaluation not completed or corrupted',
                    ],
                    configurationTips: [
                        'Ensure sharing is enabled in promptfooconfig.yaml',
                        'Check cloud authentication status',
                        'Verify evaluation exists and completed successfully',
                        'Check network connectivity to sharing service',
                    ],
                    examples: {
                        shareLatest: '{"evalId": null}',
                        shareSpecific: '{"evalId": "eval_abc123def456"}',
                        withAuth: '{"evalId": "eval_123", "showAuth": true}',
                        overwrite: '{"evalId": "eval_123", "overwrite": true}',
                    },
                },
            };
            return (0, utils_1.createToolResponse)('share_evaluation', false, errorData);
        }
    });
}
//# sourceMappingURL=shareEvaluation.js.map