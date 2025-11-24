import { OpenAiChatCompletionProvider } from './openai/chat';
import type { ProviderOptions } from '../types/index';
import type { OpenAiCompletionOptions } from './openai/types';
export interface HeliconeGatewayOptions extends OpenAiCompletionOptions {
    /** Base URL for the Helicone AI Gateway instance (defaults to http://localhost:8080) */
    baseUrl?: string;
    /** Router name for custom routing (optional, uses /ai endpoint if not specified) */
    router?: string;
    /** Model name in provider/model format (e.g., openai/gpt-4o, anthropic/claude-3-5-sonnet) */
    model?: string;
}
/**
 * Helicone AI Gateway provider
 * Routes requests through a self-hosted Helicone AI Gateway instance
 * Uses OpenAI-compatible interface with automatic provider routing
 */
export declare class HeliconeGatewayProvider extends OpenAiChatCompletionProvider {
    private heliconeConfig;
    constructor(modelName: string, options?: ProviderOptions & {
        config?: HeliconeGatewayOptions;
    });
    id(): string;
    toString(): string;
}
//# sourceMappingURL=helicone.d.ts.map