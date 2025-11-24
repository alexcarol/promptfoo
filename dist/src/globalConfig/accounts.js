"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserId = getUserId;
exports.getUserEmail = getUserEmail;
exports.setUserEmail = setUserEmail;
exports.clearUserEmail = clearUserEmail;
exports.getUserEmailNeedsValidation = getUserEmailNeedsValidation;
exports.setUserEmailNeedsValidation = setUserEmailNeedsValidation;
exports.getUserEmailValidated = getUserEmailValidated;
exports.setUserEmailValidated = setUserEmailValidated;
exports.getAuthor = getAuthor;
exports.isLoggedIntoCloud = isLoggedIntoCloud;
exports.getAuthMethod = getAuthMethod;
exports.checkEmailStatus = checkEmailStatus;
exports.promptForEmailUnverified = promptForEmailUnverified;
exports.checkEmailStatusAndMaybeExit = checkEmailStatusAndMaybeExit;
const crypto_1 = require("crypto");
const input_1 = __importDefault(require("@inquirer/input"));
const chalk_1 = __importDefault(require("chalk"));
const zod_1 = require("zod");
const constants_1 = require("../constants");
const envars_1 = require("../envars");
const logger_1 = __importDefault(require("../logger"));
const index_1 = require("../util/fetch/index");
const cloud_1 = require("./cloud");
const globalConfig_1 = require("./globalConfig");
const email_1 = require("../types/email");
function getUserId() {
    let globalConfig = (0, globalConfig_1.readGlobalConfig)();
    if (!globalConfig?.id) {
        const newId = (0, crypto_1.randomUUID)();
        globalConfig = { ...globalConfig, id: newId };
        (0, globalConfig_1.writeGlobalConfig)(globalConfig);
        return newId;
    }
    return globalConfig.id;
}
function getUserEmail() {
    const globalConfig = (0, globalConfig_1.readGlobalConfig)();
    return globalConfig?.account?.email || null;
}
function setUserEmail(email) {
    const globalConfig = (0, globalConfig_1.readGlobalConfig)();
    const account = globalConfig?.account ?? {};
    account.email = email;
    const config = { account };
    (0, globalConfig_1.writeGlobalConfigPartial)(config);
}
function clearUserEmail() {
    const globalConfig = (0, globalConfig_1.readGlobalConfig)();
    const account = globalConfig?.account ?? {};
    delete account.email;
    const config = { account };
    (0, globalConfig_1.writeGlobalConfigPartial)(config);
}
function getUserEmailNeedsValidation() {
    const globalConfig = (0, globalConfig_1.readGlobalConfig)();
    return globalConfig?.account?.emailNeedsValidation || false;
}
function setUserEmailNeedsValidation(needsValidation) {
    const globalConfig = (0, globalConfig_1.readGlobalConfig)();
    const account = globalConfig?.account ?? {};
    account.emailNeedsValidation = needsValidation;
    const config = { account };
    (0, globalConfig_1.writeGlobalConfigPartial)(config);
}
function getUserEmailValidated() {
    const globalConfig = (0, globalConfig_1.readGlobalConfig)();
    return globalConfig?.account?.emailValidated || false;
}
function setUserEmailValidated(validated) {
    const globalConfig = (0, globalConfig_1.readGlobalConfig)();
    const account = globalConfig?.account ?? {};
    account.emailValidated = validated;
    const config = { account };
    (0, globalConfig_1.writeGlobalConfigPartial)(config);
}
function getAuthor() {
    return (0, envars_1.getEnvString)('PROMPTFOO_AUTHOR') || getUserEmail() || null;
}
function isLoggedIntoCloud() {
    // Check if user has authenticated with Promptfoo Cloud
    // This supports both interactive (email-based) and non-interactive (API key) authentication
    // CI environments can authenticate via API keys, so we no longer exclude CI
    const cloudConfig = new cloud_1.CloudConfig();
    return cloudConfig.isEnabled();
}
/**
 * Get the authentication method used for cloud access
 * @returns 'api-key' | 'email' | 'none'
 */
function getAuthMethod() {
    const cloudConfig = new cloud_1.CloudConfig();
    const hasApiKey = cloudConfig.isEnabled();
    const hasEmail = !!getUserEmail();
    if (hasApiKey && hasEmail) {
        // Both present - API key is the actual auth mechanism
        return 'api-key';
    }
    if (hasApiKey) {
        return 'api-key';
    }
    if (hasEmail) {
        // Email without API key - not fully authenticated
        // (this shouldn't happen in normal flow but handle it)
        return 'email';
    }
    return 'none';
}
/**
 * Shared function to check email status with the promptfoo API
 * Used by both CLI and server routes
 */
async function checkEmailStatus(options) {
    const { default: telemetry } = await Promise.resolve().then(() => __importStar(require('../telemetry')));
    const userEmail = (0, envars_1.isCI)() ? 'ci-placeholder@promptfoo.dev' : getUserEmail();
    if (!userEmail) {
        return {
            status: email_1.NO_EMAIL_STATUS,
            hasEmail: false,
            message: 'Redteam evals require email verification. Please enter your work email:',
        };
    }
    try {
        const validateParam = options?.validate ? '&validate=true' : '';
        // Use longer timeout when validation is requested
        const timeout = options?.validate ? 3000 : 500;
        // Log when we're validating the email since it can take a sec
        if (options?.validate) {
            logger_1.default.info(`Checking email...`);
        }
        const host = (0, envars_1.getEnvString)('PROMPTFOO_CLOUD_API_URL', 'https://api.promptfoo.app');
        const resp = await (0, index_1.fetchWithTimeout)(`${host}/api/users/status?email=${encodeURIComponent(userEmail)}${validateParam}`, undefined, timeout);
        const data = (await resp.json());
        if (options?.validate) {
            if ([email_1.EmailValidationStatus.RISKY_EMAIL, email_1.EmailValidationStatus.DISPOSABLE_EMAIL].includes(data.status)) {
                // Tracking filtered emails via this telemetry endpoint for now to guage sensitivity of validation
                // We should take it out once we're happy with the sensitivity
                await telemetry.saveConsent(userEmail, {
                    source: 'filteredInvalidEmail',
                });
            }
            else {
                setUserEmailValidated(true);
                // Track the validated email via telemetry
                await telemetry.saveConsent(userEmail, {
                    source: 'promptForEmailValidated',
                });
            }
        }
        return {
            status: data.status,
            message: data.message,
            email: userEmail,
            hasEmail: true,
        };
    }
    catch (e) {
        logger_1.default.debug(`Failed to check user status: ${e}`);
        // If we can't check status, assume it's OK but log the issue
        return {
            status: email_1.EmailValidationStatus.OK,
            message: 'Unable to verify email status, but proceeding',
            email: userEmail,
            hasEmail: true,
        };
    }
}
async function promptForEmailUnverified() {
    const { default: telemetry } = await Promise.resolve().then(() => __importStar(require('../telemetry')));
    const existingEmail = getUserEmail();
    let email = (0, envars_1.isCI)() ? 'ci-placeholder@promptfoo.dev' : existingEmail;
    const existingEmailNeedsValidation = !(0, envars_1.isCI)() && getUserEmailNeedsValidation();
    const existingEmailValidated = (0, envars_1.isCI)() || getUserEmailValidated();
    let emailNeedsValidation = existingEmailNeedsValidation && !existingEmailValidated;
    if (!email) {
        await telemetry.record('feature_used', {
            feature: 'promptForEmailUnverified',
        });
        const emailSchema = zod_1.z.string().email('Please enter a valid email address');
        try {
            email = await (0, input_1.default)({
                message: 'Redteam evals require email verification. Please enter your work email:',
                validate: (input) => {
                    const result = emailSchema.safeParse(input);
                    return result.success || result.error.errors[0].message;
                },
            });
        }
        catch (err) {
            if (err?.name === 'AbortPromptError' || err?.name === 'ExitPromptError') {
                // exit cleanly on interrupt
                process.exit(1);
            }
            // Unknown error: rethrow
            logger_1.default.error('failed to prompt for email:', err);
            throw err;
        }
        setUserEmail(email);
        setUserEmailNeedsValidation(true);
        setUserEmailValidated(false);
        emailNeedsValidation = true;
        await telemetry.record('feature_used', {
            feature: 'userCompletedPromptForEmailUnverified',
        });
    }
    return { emailNeedsValidation };
}
async function checkEmailStatusAndMaybeExit(options) {
    const result = await checkEmailStatus(options);
    if (result.status === email_1.EmailValidationStatus.RISKY_EMAIL ||
        result.status === email_1.EmailValidationStatus.DISPOSABLE_EMAIL) {
        logger_1.default.error('Please use a valid work email.');
        setUserEmail('');
        return email_1.BAD_EMAIL_RESULT;
    }
    if (result.status === email_1.EmailValidationStatus.EXCEEDED_LIMIT) {
        logger_1.default.error('You have exceeded the maximum cloud inference limit. Please contact inquiries@promptfoo.dev to upgrade your account.');
        process.exit(1);
    }
    if (result.status === email_1.EmailValidationStatus.SHOW_USAGE_WARNING && result.message) {
        const border = '='.repeat(constants_1.TERMINAL_MAX_WIDTH);
        logger_1.default.info(chalk_1.default.yellow(border));
        logger_1.default.warn(chalk_1.default.yellow(result.message));
        logger_1.default.info(chalk_1.default.yellow(border));
    }
    return email_1.EMAIL_OK_STATUS;
}
//# sourceMappingURL=accounts.js.map