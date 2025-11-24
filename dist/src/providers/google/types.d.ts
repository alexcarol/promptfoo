import type { MCPConfig } from '../mcp/types';
interface Blob {
    mimeType: string;
    data: string;
}
export interface FunctionCall {
    name: string;
    args?: {
        [key: string]: any;
    };
}
interface FunctionResponse {
    name: string;
    response: {
        [key: string]: any;
    };
}
interface FileData {
    mimeType?: string;
    fileUri: string;
}
export interface Part {
    text?: string;
    inlineData?: Blob;
    functionCall?: FunctionCall;
    functionResponse?: FunctionResponse;
    fileData?: FileData;
}
export interface Content {
    parts: Part[];
    role?: string;
}
export interface Schema {
    type: 'TYPE_UNSPECIFIED' | 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT';
    format?: string;
    description?: string;
    nullable?: boolean;
    enum?: string[];
    maxItems?: string;
    minItems?: string;
    properties?: {
        [key: string]: Schema;
    };
    required?: string[];
    propertyOrdering?: string[];
    items?: Schema;
}
type SchemaType = Schema['type'];
export declare const VALID_SCHEMA_TYPES: ReadonlyArray<SchemaType>;
export interface FunctionDeclaration {
    name: string;
    description?: string;
    parameters?: Schema;
    response?: Schema;
}
interface GoogleSearchRetrieval {
    dynamicRetrievalConfig: {
        mode?: 'MODE_UNSPECIFIED' | 'MODE_DYNAMIC';
        dynamicThreshold?: number;
    };
}
export interface Tool {
    functionDeclarations?: FunctionDeclaration[];
    googleSearchRetrieval?: GoogleSearchRetrieval;
    codeExecution?: object;
    googleSearch?: object;
}
export interface CompletionOptions {
    apiKey?: string;
    apiHost?: string;
    apiBaseUrl?: string;
    headers?: {
        [key: string]: string;
    };
    projectId?: string;
    region?: string;
    publisher?: string;
    apiVersion?: string;
    anthropicVersion?: string;
    anthropic_version?: string;
    /**
     * Google service account credentials.
     * Can be:
     * 1. JSON string containing service account key
     * 2. File path prefixed with 'file://' to load from external file
     * 3. Undefined to use default authentication (Application Default Credentials)
     */
    credentials?: string;
    context?: string;
    examples?: {
        input: string;
        output: string;
    }[];
    safetySettings?: {
        category: string;
        probability: string;
    }[];
    stopSequences?: string[];
    temperature?: number;
    maxOutputTokens?: number;
    max_tokens?: number;
    topP?: number;
    top_p?: number;
    topK?: number;
    top_k?: number;
    n?: number;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '3:4' | '4:3';
    personGeneration?: 'allow_all' | 'allow_adult' | 'dont_allow';
    safetyFilterLevel?: 'block_most' | 'block_some' | 'block_few' | 'block_fewest' | 'block_low_and_above';
    addWatermark?: boolean;
    seed?: number;
    timeoutMs?: number;
    generationConfig?: {
        context?: string;
        examples?: {
            input: string;
            output: string;
        }[];
        stopSequences?: string[];
        temperature?: number;
        maxOutputTokens?: number;
        topP?: number;
        topK?: number;
        response_mime_type?: string;
        response_schema?: string;
        response_modalities?: string[];
        speechConfig?: {
            voiceConfig?: {
                prebuiltVoiceConfig?: {
                    voiceName?: string;
                };
            };
            languageCode?: string;
        };
        outputAudioTranscription?: Record<string, any>;
        inputAudioTranscription?: Record<string, any>;
        enableAffectiveDialog?: boolean;
        proactivity?: {
            proactiveAudio?: boolean;
        };
        thinkingConfig?: {
            thinkingBudget?: number;
            thinkingLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
        };
    };
    responseSchema?: string;
    toolConfig?: {
        functionCallingConfig?: {
            mode?: 'MODE_UNSPECIFIED' | 'AUTO' | 'ANY' | 'NONE';
            allowedFunctionNames?: string[];
        };
    };
    tools?: Tool[];
    /**
     * If set, automatically call these functions when the assistant activates
     * these function tools.
     */
    functionToolCallbacks?: Record<string, ((arg: string) => Promise<any>) | string>;
    /**
     * If set, spawn a python process with the file and connect to its API
     * for function tool calls at the specified URL.
     */
    functionToolStatefulApi?: {
        url: string;
        file?: string;
        pythonExecutable?: string;
    };
    systemInstruction?: Content | string;
    /**
     * Model-specific configuration for Llama models
     */
    llamaConfig?: {
        safetySettings?: {
            enabled?: boolean;
            llama_guard_settings?: Record<string, unknown>;
        };
    };
    mcp?: MCPConfig;
    /**
     * Controls role mapping when converting from OpenAI format to Gemini format.
     * If true, uses 'assistant' role (for older Gemini versions).
     * If false (default), maps 'assistant' to 'model' (for newer Gemini versions).
     */
    useAssistantRole?: boolean;
}
interface ClaudeMessage {
    role: string;
    content: Array<{
        type: string;
        text: string;
    }>;
}
export interface ClaudeRequest {
    anthropic_version: string;
    stream: boolean;
    max_tokens: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    messages: ClaudeMessage[];
}
export interface ClaudeResponse {
    id: string;
    type: string;
    role: string;
    model: string;
    content: Array<{
        type: string;
        text: string;
    }>;
    stop_reason: string;
    stop_sequence: string | null;
    usage: {
        input_tokens: number;
        cache_creation_input_tokens: number;
        cache_read_input_tokens: number;
        output_tokens: number;
    };
}
export {};
//# sourceMappingURL=types.d.ts.map