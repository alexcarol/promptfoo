"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Telemetry = exports.TelemetryEventSchema = void 0;
const posthog_node_1 = require("posthog-node");
const zod_1 = require("zod");
const constants_1 = require("./constants");
const build_1 = require("./constants/build");
const envars_1 = require("./envars");
const accounts_1 = require("./globalConfig/accounts");
const logger_1 = __importDefault(require("./logger"));
const index_1 = require("./util/fetch/index");
exports.TelemetryEventSchema = zod_1.z.object({
    event: zod_1.z.enum([
        'assertion_used',
        'command_used',
        'eval_ran',
        'feature_used',
        'funnel',
        'redteam discover',
        'redteam generate',
        'redteam init',
        'redteam poison',
        'redteam report',
        'redteam run',
        'redteam setup',
        'webui_action',
        'webui_api',
        'webui_page_view',
    ]),
    packageVersion: zod_1.z.string().optional().default(constants_1.VERSION),
    properties: zod_1.z.record(zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.array(zod_1.z.string())])),
});
let posthogClient = null;
function getPostHogClient() {
    if ((0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_TELEMETRY') || (0, envars_1.getEnvBool)('IS_TESTING')) {
        return null;
    }
    if (posthogClient === null && build_1.POSTHOG_KEY) {
        try {
            posthogClient = new posthog_node_1.PostHog(build_1.POSTHOG_KEY, {
                host: constants_1.EVENTS_ENDPOINT,
                fetch: index_1.fetchWithProxy,
            });
        }
        catch {
            posthogClient = null;
        }
    }
    return posthogClient;
}
const TELEMETRY_TIMEOUT_MS = 1000;
class Telemetry {
    constructor() {
        this.telemetryDisabledRecorded = false;
        this.id = (0, accounts_1.getUserId)();
        this.email = (0, accounts_1.getUserEmail)();
        this.identify().then(() => {
            // pass
        });
    }
    async identify() {
        if (this.disabled || (0, envars_1.getEnvBool)('IS_TESTING')) {
            return;
        }
        const client = getPostHogClient();
        if (client) {
            try {
                client.identify({
                    distinctId: this.id,
                    properties: {
                        email: this.email,
                        isLoggedIntoCloud: (0, accounts_1.isLoggedIntoCloud)(),
                        authMethod: (0, accounts_1.getAuthMethod)(),
                        isRunningInCi: (0, envars_1.isCI)(),
                    },
                });
                client.flush().catch(() => {
                    // Silently ignore flush errors
                });
            }
            catch (error) {
                logger_1.default.debug(`PostHog identify error: ${error}`);
            }
        }
    }
    get disabled() {
        return (0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_TELEMETRY');
    }
    recordTelemetryDisabled() {
        if (!this.telemetryDisabledRecorded) {
            this.sendEvent('feature_used', { feature: 'telemetry disabled' });
            this.telemetryDisabledRecorded = true;
        }
    }
    record(eventName, properties) {
        if (this.disabled) {
            this.recordTelemetryDisabled();
        }
        else {
            this.sendEvent(eventName, properties);
        }
    }
    sendEvent(eventName, properties) {
        const propertiesWithMetadata = {
            ...properties,
            packageVersion: constants_1.VERSION,
            isRunningInCi: (0, envars_1.isCI)(),
        };
        const client = getPostHogClient();
        if (client && !(0, envars_1.getEnvBool)('IS_TESTING')) {
            try {
                client.capture({
                    distinctId: this.id,
                    event: eventName,
                    properties: propertiesWithMetadata,
                });
                client.flush().catch(() => {
                    // Silently ignore flush errors
                });
            }
            catch (error) {
                logger_1.default.debug(`PostHog capture error: ${error}`);
            }
        }
        (0, index_1.fetchWithProxy)(constants_1.R_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event: eventName,
                environment: (0, envars_1.getEnvString)('NODE_ENV', 'development'),
                email: this.email,
                meta: {
                    user_id: this.id,
                    ...propertiesWithMetadata,
                },
            }),
        }).catch(() => {
            // pass
        });
    }
    async shutdown() {
        const client = getPostHogClient();
        if (client) {
            try {
                await client.shutdown();
            }
            catch (error) {
                logger_1.default.debug(`PostHog shutdown error: ${error}`);
            }
        }
    }
    /**
     * This is a separate endpoint to save consent used only for redteam data synthesis for "harmful" plugins.
     */
    async saveConsent(email, metadata) {
        try {
            const response = await (0, index_1.fetchWithTimeout)(constants_1.CONSENT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, metadata }),
            }, TELEMETRY_TIMEOUT_MS);
            if (!response.ok) {
                throw new Error(`Failed to save consent: ${response.statusText}`);
            }
        }
        catch (err) {
            logger_1.default.debug(`Failed to save consent: ${err.message}`);
        }
    }
}
exports.Telemetry = Telemetry;
const telemetry = new Telemetry();
exports.default = telemetry;
//# sourceMappingURL=telemetry.js.map