import OpenAI from 'openai';
import { OpenAiGenericProvider } from '.';
import type { Metadata } from 'openai/resources/shared';
import type { CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../../types/index';
import type { EnvOverrides } from '../../types/env';
import type { AssistantFunctionCallback, OpenAiSharedOptions } from './types';
type OpenAiAssistantOptions = OpenAiSharedOptions & {
    modelName?: string;
    instructions?: string;
    tools?: OpenAI.Beta.Threads.ThreadCreateAndRunParams['tools'];
    /**
     * If set, automatically call these functions when the assistant activates
     * these function tools.
     */
    functionToolCallbacks?: Record<OpenAI.FunctionDefinition['name'], string | AssistantFunctionCallback>;
    metadata?: Metadata;
    temperature?: number;
    toolChoice?: 'none' | 'auto' | 'required' | {
        type: 'function';
        function?: {
            name: string;
        };
    } | {
        type: 'file_search';
    };
    attachments?: OpenAI.Beta.Threads.Message.Attachment[];
    tool_resources?: OpenAI.Beta.Threads.ThreadCreateAndRunParams['tool_resources'];
};
export declare class OpenAiAssistantProvider extends OpenAiGenericProvider {
    assistantId: string;
    assistantConfig: OpenAiAssistantOptions;
    private loadedFunctionCallbacks;
    constructor(assistantId: string, options?: {
        config?: OpenAiAssistantOptions;
        id?: string;
        env?: EnvOverrides;
    });
    /**
     * Preloads all function callbacks to ensure they're ready when needed
     */
    private preloadFunctionCallbacks;
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
    callApi(prompt: string, context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
export {};
//# sourceMappingURL=assistant.d.ts.map