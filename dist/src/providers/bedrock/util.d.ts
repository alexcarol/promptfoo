interface AmazonResponse {
    output?: {
        message?: {
            role: string;
            content: {
                text?: string;
                toolUse?: {
                    name: string;
                    toolUseId: string;
                    input: any;
                };
            }[];
        };
    };
    stopReason?: string;
    usage?: {
        cacheReadInputTokenCount?: number;
        cacheWriteInputTokenCount?: number;
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
    };
}
export declare function novaOutputFromMessage(response: AmazonResponse): string | undefined;
interface TextBlockParam {
    text: string;
}
interface ImageBlockParam {
    image: {
        format: 'jpeg' | 'png' | 'gif' | 'webp';
        source: {
            bytes: Uint8Array | string;
        };
    };
}
interface ToolUseBlockParam {
    id: string;
    input: unknown;
    name: string;
}
interface ToolResultBlockParam {
    toolUseId: string;
    content?: string | Array<TextBlockParam | ImageBlockParam>;
    status?: string;
}
interface MessageParam {
    content: string | Array<TextBlockParam | ImageBlockParam | ToolUseBlockParam | ToolResultBlockParam>;
    role: 'user' | 'assistant';
}
export declare function novaParseMessages(messages: string): {
    system?: TextBlockParam[];
    extractedMessages: MessageParam[];
};
export {};
//# sourceMappingURL=util.d.ts.map