import z from 'zod';
import type { ApiEmbeddingProvider, ApiProvider, CallApiContextParams, CallApiOptionsParams, ProviderEmbeddingResponse, ProviderOptions, ProviderResponse } from '../types/index';
import type { EnvOverrides } from '../types/env';
/**
 * Zod schema for validating SageMaker options
 */
declare const SageMakerConfigSchema: z.ZodObject<{
    accessKeyId: z.ZodOptional<z.ZodString>;
    profile: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    secretAccessKey: z.ZodOptional<z.ZodString>;
    sessionToken: z.ZodOptional<z.ZodString>;
    endpoint: z.ZodOptional<z.ZodString>;
    contentType: z.ZodOptional<z.ZodString>;
    acceptType: z.ZodOptional<z.ZodString>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    topP: z.ZodOptional<z.ZodNumber>;
    stopSequences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    delay: z.ZodOptional<z.ZodNumber>;
    transform: z.ZodOptional<z.ZodString>;
    modelType: z.ZodOptional<z.ZodEnum<["openai", "llama", "huggingface", "jumpstart", "custom"]>>;
    responseFormat: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path?: string | undefined;
        type?: string | undefined;
    }, {
        path?: string | undefined;
        type?: string | undefined;
    }>>;
    basePath: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    transform?: string | undefined;
    delay?: number | undefined;
    endpoint?: string | undefined;
    profile?: string | undefined;
    modelType?: "custom" | "openai" | "llama" | "huggingface" | "jumpstart" | undefined;
    basePath?: string | undefined;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
    contentType?: string | undefined;
    accessKeyId?: string | undefined;
    secretAccessKey?: string | undefined;
    sessionToken?: string | undefined;
    region?: string | undefined;
    topP?: number | undefined;
    stopSequences?: string[] | undefined;
    responseFormat?: {
        path?: string | undefined;
        type?: string | undefined;
    } | undefined;
    acceptType?: string | undefined;
}, {
    transform?: string | undefined;
    delay?: number | undefined;
    endpoint?: string | undefined;
    profile?: string | undefined;
    modelType?: "custom" | "openai" | "llama" | "huggingface" | "jumpstart" | undefined;
    basePath?: string | undefined;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
    contentType?: string | undefined;
    accessKeyId?: string | undefined;
    secretAccessKey?: string | undefined;
    sessionToken?: string | undefined;
    region?: string | undefined;
    topP?: number | undefined;
    stopSequences?: string[] | undefined;
    responseFormat?: {
        path?: string | undefined;
        type?: string | undefined;
    } | undefined;
    acceptType?: string | undefined;
}>;
type SageMakerConfig = z.infer<typeof SageMakerConfigSchema>;
interface SageMakerOptions extends ProviderOptions {
    config?: SageMakerConfig;
}
/**
 * Base class for SageMaker providers with common functionality
 */
declare abstract class SageMakerGenericProvider {
    env?: EnvOverrides;
    sagemakerRuntime?: any;
    config: SageMakerConfig;
    endpointName: string;
    delay?: number;
    transform?: string;
    private providerId?;
    constructor(endpointName: string, options: SageMakerOptions);
    id(): string;
    toString(): string;
    /**
     * Get AWS credentials from config or environment
     */
    getCredentials(): Promise<any>;
    /**
     * Initialize and return the SageMaker runtime client
     */
    getSageMakerRuntimeInstance(): Promise<any>;
    /**
     * Get AWS region from config or environment
     */
    getRegion(): string;
    /**
     * Get SageMaker endpoint name
     */
    getEndpointName(): string;
    /**
     * Get content type for request
     */
    getContentType(): string;
    /**
     * Get accept type for response
     */
    getAcceptType(): string;
    /**
     * Apply transformation to a prompt if a transform function is specified
     * @param prompt The original prompt to transform
     * @param context Optional context information for the transformation
     * @returns The transformed prompt, or the original if no transformation is applied
     */
    applyTransformation(prompt: string, context?: CallApiContextParams): Promise<string>;
    /**
     * Extracts data from a response using a path expression
     * Supports JavaScript expressions and file-based transforms
     */
    protected extractFromPath(responseJson: any, pathExpression: string | undefined): Promise<any>;
}
/**
 * Provider for text generation with SageMaker endpoints
 */
export declare class SageMakerCompletionProvider extends SageMakerGenericProvider implements ApiProvider {
    readonly modelType: SageMakerConfig['modelType'];
    constructor(endpointName: string, options: SageMakerOptions);
    /**
     * Model type must be specified within the id or the `config.modelType` field.
     */
    private parseModelType;
    /**
     * Format the request payload based on model type
     */
    formatPayload(prompt: string): string;
    /**
     * Parse the response from SageMaker endpoint
     */
    parseResponse(responseBody: string): Promise<any>;
    /**
     * Generate a consistent cache key for SageMaker requests
     * Uses crypto.createHash to generate a shorter, more efficient key
     */
    private getCacheKey;
    /**
     * Invoke SageMaker endpoint for text generation with caching, delay support, and transformations
     */
    callApi(prompt: string, context?: CallApiContextParams, _options?: CallApiOptionsParams): Promise<ProviderResponse>;
}
/**
 * Provider for embeddings with SageMaker endpoints
 */
export declare class SageMakerEmbeddingProvider extends SageMakerGenericProvider implements ApiEmbeddingProvider {
    callApi(): Promise<ProviderResponse>;
    /**
     * Generate a consistent cache key for SageMaker embedding requests
     * Uses crypto.createHash to generate a shorter, more efficient key
     */
    private getCacheKey;
    /**
     * Invoke SageMaker endpoint for embeddings with caching, delay support, and transformations
     */
    callEmbeddingApi(text: string, context?: CallApiContextParams): Promise<ProviderEmbeddingResponse>;
    /**
     * Helper method to cache embedding results
     */
    private cacheEmbeddingResult;
}
export {};
//# sourceMappingURL=sagemaker.d.ts.map