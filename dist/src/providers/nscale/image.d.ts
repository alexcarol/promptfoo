import { OpenAiImageProvider } from '../openai/image';
import type { CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../../types/index';
import type { EnvOverrides } from '../../types/env';
import type { ApiProvider } from '../../types/providers';
import type { OpenAiSharedOptions } from '../openai/types';
/**
 * Configuration options for Nscale image generation.
 * Extends OpenAI shared options with Nscale-specific parameters.
 */
type NscaleImageOptions = OpenAiSharedOptions & {
    /** Number of images to generate (default: 1) */
    n?: number;
    /** Response format for generated images */
    response_format?: 'url' | 'b64_json';
    /** User identifier for tracking */
    user?: string;
    /** Image size specification (e.g., '1024x1024') */
    size?: string;
};
/**
 * Nscale image generation provider.
 *
 * Provides text-to-image generation capabilities using Nscale's Serverless Inference API.
 * Supports various image models including Flux.1 Schnell, SDXL Lightning, and Stable Diffusion XL.
 *
 * Authentication uses service tokens (preferred) or API keys.
 * Defaults to base64 JSON response format for compatibility with Nscale API.
 */
export declare class NscaleImageProvider extends OpenAiImageProvider {
    config: NscaleImageOptions & any;
    /**
     * Create a new Nscale image provider instance.
     *
     * @param modelName - The Nscale image model name (e.g., 'ByteDance/SDXL-Lightning-4step')
     * @param options - Provider configuration options
     */
    constructor(modelName: string, options?: {
        config?: NscaleImageOptions;
        id?: string;
        env?: EnvOverrides;
    });
    /**
     * Retrieves the API key for authentication with Nscale API.
     * Prefers service tokens over API keys as API keys are deprecated as of Oct 30, 2025.
     *
     * @param options - Configuration and environment options
     * @returns The API key or service token, or undefined if not found
     */
    private static getApiKey;
    /**
     * Gets the API key for this provider instance.
     *
     * @returns The API key or service token, or undefined if not found
     */
    getApiKey(): string | undefined;
    /**
     * Gets the default API URL for Nscale image generation endpoint.
     *
     * @returns The default Nscale API base URL
     */
    getApiUrlDefault(): string;
    /**
     * Gets the unique identifier for this provider instance.
     *
     * @returns Provider ID in the format "nscale:image:{modelName}"
     */
    id(): string;
    /**
     * Gets a string representation of this provider.
     *
     * @returns Human-readable provider description
     */
    toString(): string;
    /**
     * Calculates the cost for generating images with the specified model.
     * Pricing is based on Nscale's pricing page and varies by model.
     *
     * @param modelName - The name of the image generation model
     * @param n - Number of images to generate (default: 1)
     * @returns The estimated cost in USD
     */
    private calculateImageCost;
    callApi(prompt: string, context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
/**
 * Factory function to create a new Nscale image provider instance.
 * Parses the provider path to extract the model name and creates the provider.
 *
 * @param providerPath - Provider path in format "nscale:image:modelName"
 * @param options - Configuration options for the provider
 * @returns A new NscaleImageProvider instance
 * @throws Error if model name is missing from the provider path
 */
export declare function createNscaleImageProvider(providerPath: string, options?: {
    config?: NscaleImageOptions;
    id?: string;
    env?: EnvOverrides;
}): ApiProvider;
export {};
//# sourceMappingURL=image.d.ts.map