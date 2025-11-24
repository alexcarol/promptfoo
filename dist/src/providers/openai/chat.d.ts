import type { EnvOverrides } from '../../types/env';
import type { CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../../types/index';
import { OpenAiGenericProvider } from './';
import type { OpenAiCompletionOptions } from './types';
export declare class OpenAiChatCompletionProvider extends OpenAiGenericProvider {
    static OPENAI_CHAT_MODELS: ({
        id: string;
        cost: {
            input: number;
            output: number;
        };
    } | {
        id: string;
        cost: {
            input: number;
            output: number;
            audioOutput: number;
        };
    })[];
    static OPENAI_CHAT_MODEL_NAMES: string[];
    config: OpenAiCompletionOptions;
    private mcpClient;
    private initializationPromise;
    private loadedFunctionCallbacks;
    constructor(modelName: string, options?: {
        config?: OpenAiCompletionOptions;
        id?: string;
        env?: EnvOverrides;
    });
    private initializeMCP;
    cleanup(): Promise<void>;
    /**
     * Loads a function from an external file
     * @param fileRef The file reference in the format 'file://path/to/file:functionName'
     * @returns The loaded function
     */
    private loadExternalFunction;
    /**
     * Executes a function callback with proper error handling
     */
    private executeFunctionCallback;
    protected isReasoningModel(): boolean;
    protected supportsTemperature(): boolean;
    getOpenAiBody(prompt: string, context?: CallApiContextParams, callApiOptions?: CallApiOptionsParams): {
        body: any;
        config: any;
    };
    callApi(prompt: string, context?: CallApiContextParams, callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
//# sourceMappingURL=chat.d.ts.map