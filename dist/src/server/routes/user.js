"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const envars_1 = require("../../envars");
const accounts_1 = require("../../globalConfig/accounts");
const cloud_1 = require("../../globalConfig/cloud");
const logger_1 = __importDefault(require("../../logger"));
const telemetry_1 = __importDefault(require("../../telemetry"));
const apiSchemas_1 = require("../apiSchemas");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.get('/email', async (_req, res) => {
    try {
        const email = (0, accounts_1.getUserEmail)();
        // Return 200 with null email instead of 404 to avoid console errors when no email is configured
        res.json(apiSchemas_1.ApiSchemas.User.Get.Response.parse({ email: email || null }));
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            logger_1.default.error(`Error getting email: ${(0, zod_validation_error_1.fromError)(error)}`);
        }
        else {
            logger_1.default.error(`Error getting email: ${error}`);
        }
        res.status(500).json({ error: 'Failed to get email' });
    }
});
exports.userRouter.get('/id', async (_req, res) => {
    try {
        const id = (0, accounts_1.getUserId)();
        res.json(apiSchemas_1.ApiSchemas.User.GetId.Response.parse({ id }));
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            logger_1.default.error(`Error getting user ID: ${(0, zod_validation_error_1.fromError)(error)}`);
        }
        else {
            logger_1.default.error(`Error getting user ID: ${error}`);
        }
        res.status(500).json({ error: 'Failed to get user ID' });
    }
});
exports.userRouter.post('/email', async (req, res) => {
    try {
        const { email } = apiSchemas_1.ApiSchemas.User.Update.Request.parse(req.body);
        (0, accounts_1.setUserEmail)(email);
        res.json(apiSchemas_1.ApiSchemas.User.Update.Response.parse({
            success: true,
            message: `Email updated`,
        }));
        await telemetry_1.default.record('webui_api', {
            event: 'email_set',
            email,
            selfHosted: (0, envars_1.getEnvBool)('PROMPTFOO_SELF_HOSTED'),
        });
        await telemetry_1.default.saveConsent(email, {
            source: 'webui_redteam',
        });
    }
    catch (error) {
        logger_1.default.error(`Error setting email: ${error}`);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: (0, zod_validation_error_1.fromError)(error).toString() });
        }
        else {
            res.status(500).json({ error: String(error) });
        }
    }
});
exports.userRouter.put('/email/clear', async (_req, res) => {
    try {
        (0, accounts_1.clearUserEmail)();
        res.json({ success: true, message: 'Email cleared' });
    }
    catch (error) {
        logger_1.default.error(`Error clearing email: ${error}`);
        res.status(500).json({ error: 'Failed to clear email' });
    }
});
exports.userRouter.get('/email/status', async (req, res) => {
    try {
        // Extract validate query parameter
        const validate = req.query.validate === 'true';
        const result = await (0, accounts_1.checkEmailStatus)({ validate });
        res.json(apiSchemas_1.ApiSchemas.User.EmailStatus.Response.parse({
            hasEmail: result.hasEmail,
            email: result.email,
            status: result.status,
            message: result.message,
        }));
    }
    catch (error) {
        logger_1.default.error(`Error checking email status: ${error}`);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: (0, zod_validation_error_1.fromError)(error).toString() });
        }
        else {
            res.status(500).json({ error: 'Failed to check email status' });
        }
    }
});
// New API key authentication endpoint that mirrors CLI behavior
exports.userRouter.post('/login', async (req, res) => {
    try {
        const { apiKey, apiHost } = zod_1.z
            .object({
            apiKey: zod_1.z.string().min(1, 'API key is required').max(512, 'API key too long'),
            apiHost: zod_1.z.string().url().optional(),
        })
            .parse(req.body);
        const host = apiHost || cloud_1.cloudConfig.getApiHost();
        // Use the same validation logic as CLI
        const { user, organization, app } = await cloud_1.cloudConfig.validateAndSetApiToken(apiKey, host);
        // Sync email to local config (same as CLI)
        const existingEmail = (0, accounts_1.getUserEmail)();
        if (existingEmail && existingEmail !== user.email) {
            logger_1.default.info(`Updating local email configuration from ${existingEmail} to ${user.email}`);
        }
        (0, accounts_1.setUserEmail)(user.email);
        // Record telemetry and consent
        await telemetry_1.default.record('webui_api', {
            event: 'api_key_login',
            email: user.email,
            selfHosted: (0, envars_1.getEnvBool)('PROMPTFOO_SELF_HOSTED'),
        });
        await telemetry_1.default.saveConsent(user.email, {
            source: 'web_login',
        });
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            organization: {
                id: organization.id,
                name: organization.name,
            },
            app: {
                url: app.url,
            },
        });
    }
    catch (error) {
        logger_1.default.error(`Error during API key login: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: (0, zod_validation_error_1.fromError)(error).toString() });
        }
        else {
            // Don't expose internal error details to client
            res.status(401).json({ error: 'Invalid API key or authentication failed' });
        }
    }
});
// Logout endpoint - clears local authentication data
exports.userRouter.post('/logout', async (_req, res) => {
    try {
        // Clear stored email and cloud config (same as CLI logout)
        (0, accounts_1.setUserEmail)('');
        cloud_1.cloudConfig.delete();
        logger_1.default.info('User logged out successfully');
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        logger_1.default.error(`Error during logout: ${error instanceof Error ? error.message : 'Unknown error'}`);
        res.status(500).json({ error: 'Logout failed' });
    }
});
/**
 * Returns information about the Promptfoo Cloud config for the current user.
 */
exports.userRouter.get('/cloud-config', async (_req, res) => {
    try {
        const cloudConfigData = {
            appUrl: cloud_1.cloudConfig.getAppUrl(),
            isEnabled: cloud_1.cloudConfig.isEnabled(),
        };
        res.json({
            appUrl: cloudConfigData.appUrl,
            isEnabled: cloudConfigData.isEnabled,
        });
    }
    catch (error) {
        logger_1.default.error(`Error getting cloud config: ${error}`);
        res.status(500).json({ error: 'Failed to get cloud config' });
    }
});
//# sourceMappingURL=user.js.map