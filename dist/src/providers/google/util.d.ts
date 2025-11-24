import { z } from 'zod';
import type { Content, Part, Tool } from './types';
type Probability = 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH';
interface SafetyRating {
    category: 'HARM_CATEGORY_HARASSMENT' | 'HARM_CATEGORY_HATE_SPEECH' | 'HARM_CATEGORY_SEXUALLY_EXPLICIT' | 'HARM_CATEGORY_DANGEROUS_CONTENT';
    probability: Probability;
    blocked: boolean;
}
interface Candidate {
    content: Content;
    finishReason?: 'BLOCKLIST' | 'FINISH_REASON_UNSPECIFIED' | 'MALFORMED_FUNCTION_CALL' | 'MAX_TOKENS' | 'OTHER' | 'PROHIBITED_CONTENT' | 'RECITATION' | 'SAFETY' | 'SPII' | 'STOP';
    groundingChunks?: Record<string, any>[];
    groundingMetadata?: Record<string, any>;
    groundingSupports?: Record<string, any>[];
    safetyRatings: SafetyRating[];
    webSearchQueries?: string[];
}
interface GeminiUsageMetadata {
    promptTokenCount: number;
    candidatesTokenCount?: number;
    totalTokenCount: number;
    thoughtsTokenCount?: number;
}
export interface GeminiErrorResponse {
    error: {
        code: number;
        message: string;
        status: string;
    };
}
export interface GeminiResponseData {
    candidates: Candidate[];
    usageMetadata?: GeminiUsageMetadata;
    promptFeedback?: {
        safetyRatings: Array<{
            category: string;
            probability: string;
        }>;
        blockReason: any;
    };
}
interface GeminiPromptFeedback {
    blockReason?: 'PROHIBITED_CONTENT';
}
interface GeminiUsageMetadata {
    promptTokenCount: number;
    totalTokenCount: number;
    thoughtsTokenCount?: number;
}
interface GeminiBlockedResponse {
    promptFeedback: GeminiPromptFeedback;
    usageMetadata: GeminiUsageMetadata;
}
export type GeminiApiResponse = (GeminiResponseData | GeminiErrorResponse | GeminiBlockedResponse)[];
export interface Palm2ApiResponse {
    error?: {
        code: string;
        message: string;
    };
    predictions?: [
        {
            candidates: [
                {
                    content: string;
                }
            ];
        }
    ];
}
declare const GeminiFormatSchema: z.ZodArray<z.ZodObject<{
    role: z.ZodOptional<z.ZodEnum<["user", "model"]>>;
    parts: z.ZodArray<z.ZodObject<{
        text: z.ZodOptional<z.ZodString>;
        inline_data: z.ZodOptional<z.ZodObject<{
            mime_type: z.ZodString;
            data: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            data: string;
            mime_type: string;
        }, {
            data: string;
            mime_type: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        text?: string | undefined;
        inline_data?: {
            data: string;
            mime_type: string;
        } | undefined;
    }, {
        text?: string | undefined;
        inline_data?: {
            data: string;
            mime_type: string;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    parts: {
        text?: string | undefined;
        inline_data?: {
            data: string;
            mime_type: string;
        } | undefined;
    }[];
    role?: "user" | "model" | undefined;
}, {
    parts: {
        text?: string | undefined;
        inline_data?: {
            data: string;
            mime_type: string;
        } | undefined;
    }[];
    role?: "user" | "model" | undefined;
}>, "many">;
export type GeminiFormat = z.infer<typeof GeminiFormatSchema>;
export declare function maybeCoerceToGeminiFormat(contents: any, options?: {
    useAssistantRole?: boolean;
}): {
    contents: GeminiFormat;
    coerced: boolean;
    systemInstruction: {
        parts: [Part, ...Part[]];
    } | undefined;
};
/**
 * Loads and processes Google credentials from various sources
 */
export declare function loadCredentials(credentials?: string): string | undefined;
/**
 * Creates a Google client with optional custom credentials
 */
export declare function getGoogleClient({ credentials }?: {
    credentials?: string;
}): Promise<{
    client: import("google-auth-library").AuthClient;
    projectId: string | undefined;
}>;
/**
 * Gets project ID from config, environment, or Google client
 */
export declare function resolveProjectId(config: {
    projectId?: string;
    credentials?: string;
}, env?: Record<string, string>): Promise<string>;
export declare function hasGoogleDefaultCredentials(): Promise<boolean>;
export declare function getCandidate(data: GeminiResponseData): Candidate;
export declare function formatCandidateContents(candidate: Candidate): string | Part[];
export declare function mergeParts(parts1: Part[] | string | undefined, parts2: Part[] | string): string | Part[];
/**
 * Normalizes tools configuration to handle both snake_case and camelCase formats.
 * This ensures compatibility with both Google API formats while maintaining
 * consistent behavior in our codebase.
 */
export declare function normalizeTools(tools: Tool[]): Tool[];
export declare function loadFile(config_var: Tool[] | string | undefined, context_vars: Record<string, string | object> | undefined): any;
export declare function geminiFormatAndSystemInstructions(prompt: string, contextVars?: Record<string, string | object>, configSystemInstruction?: Content | string, options?: {
    useAssistantRole?: boolean;
}): {
    contents: GeminiFormat;
    systemInstruction: Content | {
        parts: [Part, ...Part[]];
    } | undefined;
};
export declare function parseStringObject(input: string | any): any;
export declare function validateFunctionCall(output: string | object, functions?: Tool[] | string, vars?: Record<string, string | object>): void;
export {};
//# sourceMappingURL=util.d.ts.map