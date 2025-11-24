"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackProvider = void 0;
exports.createSlackProvider = createSlackProvider;
const web_api_1 = require("@slack/web-api");
const logger_1 = __importDefault(require("../logger"));
class SlackProvider {
    constructor(options = {}) {
        this.options = options;
        const token = options.config?.token || process.env.SLACK_BOT_TOKEN;
        if (!token) {
            throw new Error('Slack provider requires a token. Set SLACK_BOT_TOKEN or provide it in config.');
        }
        if (!options.config?.channel) {
            throw new Error('Slack provider requires a channel ID');
        }
        this.client = new web_api_1.WebClient(token);
    }
    id() {
        return this.options.id || 'slack';
    }
    async callApi(prompt, _context, _options) {
        const config = this.options.config;
        const channel = config.channel;
        const timeout = config.timeout || 60000;
        const responseStrategy = config.responseStrategy || 'first';
        try {
            // Format the message if a custom formatter is provided
            const messageText = config.formatMessage ? config.formatMessage(prompt) : prompt;
            // Send the message
            const startTime = Date.now();
            const postResult = await this.client.chat.postMessage({
                channel,
                text: messageText,
                thread_ts: config.threadTs,
                // Parse mode for better formatting
                mrkdwn: true,
            });
            if (!postResult.ok || !postResult.ts) {
                throw new Error('Failed to post message to Slack');
            }
            const messageTs = postResult.ts;
            // Handle different response collection strategies
            let responseText;
            const responseMetadata = {
                messageTs,
                channel,
            };
            switch (responseStrategy) {
                case 'timeout':
                    // Just wait for the timeout and collect all responses
                    responseText = await this.collectResponsesUntilTimeout(channel, messageTs, timeout);
                    break;
                case 'user':
                    if (!config.waitForUser) {
                        throw new Error('waitForUser must be specified when using "user" response strategy');
                    }
                    responseText = await this.waitForUserResponse(channel, messageTs, config.waitForUser, timeout);
                    responseMetadata.waitForUser = config.waitForUser;
                    break;
                case 'first':
                default:
                    responseText = await this.waitForFirstResponse(channel, messageTs, timeout);
                    break;
            }
            if (config.includeThread) {
                responseMetadata.threadTs = messageTs;
            }
            // Calculate response time
            responseMetadata.responseTime = Date.now() - startTime;
            return {
                output: responseText,
                metadata: responseMetadata,
            };
        }
        catch (error) {
            logger_1.default.error(`Slack provider error: ${error}`);
            // Handle specific Slack API errors
            if (error?.data?.error) {
                const slackError = error.data.error;
                switch (slackError) {
                    case 'channel_not_found':
                        return { error: `Channel ${channel} not found. Please check the channel ID.` };
                    case 'not_in_channel':
                        return { error: `Bot is not in channel ${channel}. Please invite the bot first.` };
                    case 'missing_scope':
                        return { error: 'Bot token is missing required scopes. Please check permissions.' };
                    case 'ratelimited':
                        return { error: 'Slack API rate limit exceeded. Please try again later.' };
                    default:
                        return { error: `Slack API error: ${slackError}` };
                }
            }
            return {
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async waitForFirstResponse(channel, afterTs, timeout) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                // Get conversation history
                const result = await this.client.conversations.history({
                    channel,
                    oldest: afterTs,
                    limit: 10,
                });
                if (result.messages && result.messages.length > 0) {
                    // Find first non-bot message after our message
                    const response = result.messages
                        .filter((msg) => msg.ts !== afterTs && msg.type === 'message' && !msg.bot_id)
                        .sort((a, b) => parseFloat(a.ts || '0') - parseFloat(b.ts || '0'))[0];
                    if (response && response.text) {
                        return response.text;
                    }
                }
                // Wait before polling again
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            catch (error) {
                logger_1.default.error(`Error fetching Slack messages: ${error}`);
                throw error;
            }
        }
        throw new Error(`Timeout waiting for Slack response after ${timeout}ms`);
    }
    async waitForUserResponse(channel, afterTs, userId, timeout) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                const result = await this.client.conversations.history({
                    channel,
                    oldest: afterTs,
                    limit: 20,
                });
                if (result.messages && result.messages.length > 0) {
                    const response = result.messages
                        .filter((msg) => msg.ts !== afterTs && msg.type === 'message' && msg.user === userId)
                        .sort((a, b) => parseFloat(a.ts || '0') - parseFloat(b.ts || '0'))[0];
                    if (response && response.text) {
                        return response.text;
                    }
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            catch (error) {
                logger_1.default.error(`Error fetching Slack messages: ${error}`);
                throw error;
            }
        }
        throw new Error(`Timeout waiting for response from user ${userId} after ${timeout}ms`);
    }
    async collectResponsesUntilTimeout(channel, afterTs, timeout) {
        const startTime = Date.now();
        const responses = [];
        const seenTimestamps = new Set([afterTs]);
        while (Date.now() - startTime < timeout) {
            try {
                const result = await this.client.conversations.history({
                    channel,
                    oldest: afterTs,
                    limit: 50,
                });
                if (result.messages && result.messages.length > 0) {
                    const newResponses = result.messages
                        .filter((msg) => !seenTimestamps.has(msg.ts || '') && msg.type === 'message' && !msg.bot_id)
                        .sort((a, b) => parseFloat(a.ts || '0') - parseFloat(b.ts || '0'));
                    newResponses.forEach((msg) => {
                        if (msg.ts) {
                            seenTimestamps.add(msg.ts);
                        }
                        if (msg.text) {
                            responses.push(msg.text);
                        }
                    });
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            catch (error) {
                logger_1.default.error(`Error fetching Slack messages: ${error}`);
                throw error;
            }
        }
        return responses.join('\n\n');
    }
}
exports.SlackProvider = SlackProvider;
// Export convenience function for creating from provider string
function createSlackProvider(channel, options) {
    return new SlackProvider({
        ...options,
        config: {
            channel,
        },
    });
}
//# sourceMappingURL=slack.js.map