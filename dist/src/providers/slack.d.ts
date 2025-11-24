import type { ApiProvider, ProviderResponse, CallApiContextParams, CallApiOptionsParams } from '../types/index';
export interface SlackProviderOptions {
    id?: string;
    config?: {
        /** Slack Bot User OAuth Token (xoxb-...) */
        token?: string;
        /** Channel ID (C...) or user ID (U...) to send messages to */
        channel?: string;
        /** Response collection strategy */
        responseStrategy?: 'first' | 'user' | 'timeout';
        /** User ID to wait for responses from (when responseStrategy is 'user') */
        waitForUser?: string;
        /** Timeout in milliseconds (default: 60000) */
        timeout?: number;
        /** Whether to include thread timestamp in output */
        includeThread?: boolean;
        /** Custom message formatting function */
        formatMessage?: (prompt: string) => string;
        /** Whether to mention users in the message */
        mentionUsers?: boolean;
        /** Thread timestamp to reply in */
        threadTs?: string;
    };
}
export declare class SlackProvider implements ApiProvider {
    private client;
    private options;
    constructor(options?: SlackProviderOptions);
    id(): string;
    callApi(prompt: string, _context?: CallApiContextParams, _options?: CallApiOptionsParams): Promise<ProviderResponse>;
    private waitForFirstResponse;
    private waitForUserResponse;
    private collectResponsesUntilTimeout;
}
export declare function createSlackProvider(channel: string, options?: Omit<SlackProviderOptions, 'config'>): SlackProvider;
//# sourceMappingURL=slack.d.ts.map