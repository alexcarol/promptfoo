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
exports.cloudConfig = exports.CloudConfig = exports.API_HOST = exports.CLOUD_API_HOST = void 0;
const envars_1 = require("../envars");
const logger_1 = __importDefault(require("../logger"));
const globalConfig_1 = require("./globalConfig");
exports.CLOUD_API_HOST = 'https://api.promptfoo.app';
exports.API_HOST = (0, envars_1.getEnvString)('API_HOST', exports.CLOUD_API_HOST);
class CloudConfig {
    constructor() {
        const savedConfig = (0, globalConfig_1.readGlobalConfig)()?.cloud || {};
        this.config = {
            appUrl: savedConfig.appUrl || 'https://www.promptfoo.app',
            apiHost: savedConfig.apiHost || exports.API_HOST,
            apiKey: savedConfig.apiKey,
            currentOrganizationId: savedConfig.currentOrganizationId,
            currentTeamId: savedConfig.currentTeamId,
            teams: savedConfig.teams,
        };
    }
    isEnabled() {
        return !!this.config.apiKey;
    }
    setApiHost(apiHost) {
        this.config.apiHost = apiHost;
        this.saveConfig();
    }
    setApiKey(apiKey) {
        this.config.apiKey = apiKey;
        this.saveConfig();
    }
    getApiKey() {
        return this.config.apiKey;
    }
    getApiHost() {
        return this.config.apiHost;
    }
    setAppUrl(appUrl) {
        this.config.appUrl = appUrl;
        this.saveConfig();
    }
    getAppUrl() {
        return this.config.appUrl;
    }
    delete() {
        (0, globalConfig_1.writeGlobalConfigPartial)({ cloud: {} });
    }
    saveConfig() {
        (0, globalConfig_1.writeGlobalConfigPartial)({ cloud: this.config });
        this.reload();
    }
    reload() {
        const savedConfig = (0, globalConfig_1.readGlobalConfig)()?.cloud || {};
        this.config = {
            appUrl: savedConfig.appUrl || 'https://www.promptfoo.app',
            apiHost: savedConfig.apiHost || exports.API_HOST,
            apiKey: savedConfig.apiKey,
            currentOrganizationId: savedConfig.currentOrganizationId,
            currentTeamId: savedConfig.currentTeamId,
            teams: savedConfig.teams,
        };
    }
    async validateAndSetApiToken(token, apiHost) {
        try {
            const { fetchWithProxy } = await Promise.resolve().then(() => __importStar(require('../util/fetch')));
            const response = await fetchWithProxy(`${apiHost}/api/v1/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorMessage = await response.text();
                logger_1.default.error(`[Cloud] Failed to validate API token: ${errorMessage}. HTTP Status: ${response.status} - ${response.statusText}.`);
                throw new Error('Failed to validate API token: ' + response.statusText);
            }
            const { user, organization, app } = await response.json();
            this.setApiKey(token);
            this.setApiHost(apiHost);
            this.setAppUrl(app.url);
            return {
                user,
                organization,
                app,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.default.error(`[Cloud] Failed to validate API token with host ${apiHost}: ${errorMessage}`);
            if (error.cause) {
                logger_1.default.error(`Cause: ${error.cause}`);
            }
            throw error;
        }
    }
    getCurrentOrganizationId() {
        return this.config.currentOrganizationId;
    }
    setCurrentOrganization(organizationId) {
        this.config.currentOrganizationId = organizationId;
        this.saveConfig();
    }
    getCurrentTeamId(organizationId) {
        if (organizationId) {
            return this.config.teams?.[organizationId]?.currentTeamId;
        }
        return this.config.currentTeamId;
    }
    setCurrentTeamId(teamId, organizationId) {
        if (organizationId) {
            if (!this.config.teams) {
                this.config.teams = {};
            }
            if (!this.config.teams[organizationId]) {
                this.config.teams[organizationId] = {};
            }
            this.config.teams[organizationId].currentTeamId = teamId;
        }
        else {
            this.config.currentTeamId = teamId;
        }
        this.saveConfig();
    }
    clearCurrentTeamId(organizationId) {
        if (organizationId) {
            if (this.config.teams?.[organizationId]) {
                delete this.config.teams[organizationId].currentTeamId;
            }
        }
        else {
            delete this.config.currentTeamId;
        }
        this.saveConfig();
    }
    cacheTeams(teams, organizationId) {
        if (organizationId) {
            if (!this.config.teams) {
                this.config.teams = {};
            }
            if (!this.config.teams[organizationId]) {
                this.config.teams[organizationId] = {};
            }
            this.config.teams[organizationId].cache = teams.map((t) => ({
                id: t.id,
                name: t.name,
                slug: t.slug,
                lastFetched: new Date().toISOString(),
            }));
        }
        this.saveConfig();
    }
    getCachedTeams(organizationId) {
        if (organizationId) {
            return this.config.teams?.[organizationId]?.cache;
        }
        return undefined;
    }
}
exports.CloudConfig = CloudConfig;
// singleton instance
exports.cloudConfig = new CloudConfig();
//# sourceMappingURL=cloud.js.map