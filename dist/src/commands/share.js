"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notCloudEnabledShareInstructions = notCloudEnabledShareInstructions;
exports.createAndDisplayShareableUrl = createAndDisplayShareableUrl;
exports.createAndDisplayShareableModelAuditUrl = createAndDisplayShareableModelAuditUrl;
exports.shareCommand = shareCommand;
const confirm_1 = __importDefault(require("@inquirer/confirm"));
const chalk_1 = __importDefault(require("chalk"));
const dedent_1 = __importDefault(require("dedent"));
const constants_1 = require("../constants");
const cloud_1 = require("../globalConfig/cloud");
const logger_1 = __importDefault(require("../logger"));
const eval_1 = __importDefault(require("../models/eval"));
const modelAudit_1 = __importDefault(require("../models/modelAudit"));
const share_1 = require("../share");
const telemetry_1 = __importDefault(require("../telemetry"));
const default_1 = require("../util/config/default");
function notCloudEnabledShareInstructions() {
    const cloudUrl = (0, constants_1.getDefaultShareViewBaseUrl)();
    const welcomeUrl = `${cloudUrl}/welcome`;
    logger_1.default.info((0, dedent_1.default) `

    » You need to have a cloud account to securely share your results.

    1. Please go to ${chalk_1.default.greenBright.bold(cloudUrl)} to sign up or log in.
    2. Follow the instructions at ${chalk_1.default.greenBright.bold(welcomeUrl)} to login to the command line.
    3. Run ${chalk_1.default.greenBright.bold('promptfoo share')}
  `);
}
async function createAndDisplayShareableUrl(evalRecord, showAuth) {
    const url = await (0, share_1.createShareableUrl)(evalRecord, showAuth);
    if (url) {
        logger_1.default.info(`View results: ${chalk_1.default.greenBright.bold(url)}`);
    }
    else {
        logger_1.default.error(`Failed to create shareable URL for eval ${evalRecord.id}`);
        process.exitCode = 1;
    }
    return url;
}
async function createAndDisplayShareableModelAuditUrl(auditRecord, showAuth) {
    const url = await (0, share_1.createShareableModelAuditUrl)(auditRecord, showAuth);
    if (url) {
        logger_1.default.info(`View ModelAudit Scan Results: ${chalk_1.default.greenBright.bold(url)}`);
    }
    else {
        logger_1.default.error(`Failed to create shareable URL for model audit ${auditRecord.id}`);
        process.exitCode = 1;
    }
    return url;
}
function shareCommand(program) {
    program
        .command('share [id]')
        .description('Create a shareable URL of an eval or a model audit (defaults to most recent)' + '\n\n')
        .option('--show-auth', 'Show username/password authentication information in the URL if exists', false)
        // NOTE: Added in 0.109.1 after migrating sharing to promptfoo.app in 0.108.0
        .option('-y, --yes', 'Flag does nothing (maintained for backwards compatibility only - shares are now private by default)', false)
        .action(async (id, cmdObj) => {
        telemetry_1.default.record('command_used', {
            name: 'share',
        });
        let isEval = false;
        let eval_ = null;
        let audit = null;
        if (id) {
            // Determine type based on ID format (keep original simple logic for compatibility)
            if (id.startsWith('scan-')) {
                audit = await modelAudit_1.default.findById(id);
                if (!audit) {
                    logger_1.default.error(`Could not find model audit with ID ${chalk_1.default.bold(id)}.`);
                    process.exitCode = 1;
                    return;
                }
            }
            else {
                // Assume it's an eval ID (could be eval- prefix or other format)
                isEval = true;
                eval_ = await eval_1.default.findById(id);
                if (!eval_) {
                    logger_1.default.error(`Could not find eval with ID ${chalk_1.default.bold(id)}.`);
                    process.exitCode = 1;
                    return;
                }
            }
        }
        else {
            // No ID provided, find the most recent of either type
            const [latestEval, latestAudit] = await Promise.all([eval_1.default.latest(), modelAudit_1.default.latest()]);
            if (!latestEval && !latestAudit) {
                logger_1.default.error('Could not load results. Do you need to run `promptfoo eval` or `promptfoo scan-model` first?');
                process.exitCode = 1;
                return;
            }
            // Choose the most recent based on creation time
            const evalTime = latestEval?.createdAt || 0;
            const auditTime = latestAudit?.createdAt || 0;
            if (evalTime > auditTime) {
                isEval = true;
                eval_ = latestEval;
            }
            else {
                audit = latestAudit;
            }
        }
        // Now show what we're sharing
        if (isEval && eval_) {
            logger_1.default.info(`Sharing eval ${eval_.id}`);
        }
        else if (audit) {
            logger_1.default.info(`Sharing model audit ${audit.id}`);
        }
        // Handle evaluation sharing (prioritized since evals are more important)
        if (isEval && eval_) {
            try {
                const { defaultConfig: currentConfig } = await (0, default_1.loadDefaultConfig)();
                if (currentConfig && currentConfig.sharing) {
                    eval_.config.sharing = currentConfig.sharing;
                    logger_1.default.debug(`Applied sharing config from promptfooconfig.yaml: ${JSON.stringify(currentConfig.sharing)}`);
                }
            }
            catch (err) {
                logger_1.default.debug(`Could not load config: ${err}`);
            }
            if (eval_.prompts.length === 0) {
                // FIXME(ian): Handle this on the server side.
                logger_1.default.error((0, dedent_1.default) `
                Eval ${chalk_1.default.bold(eval_.id)} cannot be shared.
                This may be because the eval is still running or because it did not complete successfully.
                If your eval is still running, wait for it to complete and try again.
              `);
                process.exitCode = 1;
                return;
            }
            // Validate that the user has authenticated with Cloud.
            if (!(0, share_1.isSharingEnabled)(eval_)) {
                notCloudEnabledShareInstructions();
                process.exitCode = 1;
                return;
            }
            if (
            // Idempotency is not implemented in self-hosted mode.
            cloud_1.cloudConfig.isEnabled() &&
                (await (0, share_1.hasEvalBeenShared)(eval_))) {
                const url = await (0, share_1.getShareableUrl)(eval_, 
                // `remoteEvalId` is always the Eval ID when sharing to Cloud.
                eval_.id, cmdObj.showAuth);
                let shouldContinue = false;
                try {
                    shouldContinue = await (0, confirm_1.default)({
                        message: (0, dedent_1.default) `
                  Already shared at:
                    ${chalk_1.default.cyan(url)}

                  Re-share (will overwrite existing data)?
                `,
                    });
                }
                catch {
                    // User pressed Ctrl+C or cancelled
                    process.exitCode = 0;
                    return;
                }
                if (!shouldContinue) {
                    process.exitCode = 0;
                    return;
                }
            }
            await createAndDisplayShareableUrl(eval_, cmdObj.showAuth);
            return;
        }
        // Handle model audit sharing
        if (!audit) {
            logger_1.default.error('Unexpected error: no eval or audit to share');
            process.exitCode = 1;
            return;
        }
        // Validate that the user has authenticated with Cloud for model audit sharing.
        if (!(0, share_1.isModelAuditSharingEnabled)()) {
            notCloudEnabledShareInstructions();
            process.exitCode = 1;
            return;
        }
        if (
        // Idempotency is not implemented in self-hosted mode.
        cloud_1.cloudConfig.isEnabled() &&
            (await (0, share_1.hasModelAuditBeenShared)(audit))) {
            const url = (0, share_1.getShareableModelAuditUrl)(audit, 
            // `remoteAuditId` is always the Audit ID when sharing to Cloud.
            audit.id, cmdObj.showAuth);
            const shouldContinue = await (0, confirm_1.default)({
                message: `This model audit is already shared at ${url}. Sharing it again will overwrite the existing data. Continue?`,
            });
            if (!shouldContinue) {
                process.exitCode = 0;
                return;
            }
        }
        await createAndDisplayShareableModelAuditUrl(audit, cmdObj.showAuth);
    });
}
//# sourceMappingURL=share.js.map