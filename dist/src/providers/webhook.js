"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookProvider = void 0;
const cache_1 = require("../cache");
const shared_1 = require("./shared");
class WebhookProvider {
    constructor(webhookUrl, options = {}) {
        const { id, config } = options;
        this.webhookUrl = webhookUrl;
        this.id = id ? () => id : this.id;
        this.config = config;
    }
    id() {
        return `webhook:${this.webhookUrl}`;
    }
    toString() {
        return `[Webhook Provider ${this.webhookUrl}]`;
    }
    async callApi(prompt) {
        const params = {
            prompt,
        };
        if (this.config) {
            params.config = this.config;
        }
        let data, cached = false, latencyMs;
        try {
            ({ data, cached, latencyMs } = await (0, cache_1.fetchWithCache)(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            }, shared_1.REQUEST_TIMEOUT_MS, 'json'));
        }
        catch (err) {
            return {
                error: `Webhook call error: ${String(err)}`,
            };
        }
        if (data && typeof data.output === 'string') {
            return {
                output: data.output,
                cached,
                latencyMs,
            };
        }
        else {
            return {
                error: `Webhook response error: Unexpected response format: ${JSON.stringify(data)}`,
            };
        }
    }
}
exports.WebhookProvider = WebhookProvider;
//# sourceMappingURL=webhook.js.map