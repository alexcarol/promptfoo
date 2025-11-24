"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthHeaders = getAuthHeaders;
function getAuthHeaders(server) {
    if (!server.auth) {
        return {};
    }
    if (server.auth.type === 'bearer' && server.auth.token) {
        return { Authorization: `Bearer ${server.auth.token}` };
    }
    if (server.auth.type === 'api_key' && server.auth.api_key) {
        return { 'X-API-Key': server.auth.api_key };
    }
    return {};
}
//# sourceMappingURL=util.js.map