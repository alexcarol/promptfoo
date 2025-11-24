"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFoundationModelProvider = void 0;
const NON_BASE_MODEL_PROVIDERS = ['http', 'ws', 'mcp', 'https', 'webhook', 'file', 'exec'];
const isFoundationModelProvider = (providerId) => {
    return !NON_BASE_MODEL_PROVIDERS.some((provider) => providerId.startsWith(provider));
};
exports.isFoundationModelProvider = isFoundationModelProvider;
//# sourceMappingURL=constants.js.map