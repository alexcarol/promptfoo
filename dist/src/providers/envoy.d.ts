import type { ApiProvider, ProviderOptions } from '../types/index';
import type { EnvOverrides } from '../types/env';
/**
 * Creates an Envoy AI Gateway provider using OpenAI-compatible endpoints
 *
 * Documentation: https://aigateway.envoyproxy.io/docs/getting-started/basic-usage
 *
 * The Envoy AI Gateway provides OpenAI-compatible endpoints:
 * - /v1/chat/completions for chat
 * - /v1/embeddings for embeddings
 *
 * Example configurations:
 * ```yaml
 * providers:
 *   - id: envoy:my-model
 *     config:
 *       apiBaseUrl: "https://your-envoy-gateway.com/v1"
 *       # Authentication is optional and depends on your gateway setup:
 *       apiKey: "your-api-key"  # if using API key auth
 *       # headers:               # if using custom headers
 *       #   Authorization: "Bearer token"
 *       #   X-Custom-Auth: "value"
 * ```
 */
export declare function createEnvoyProvider(providerPath: string, options?: {
    config?: ProviderOptions;
    id?: string;
    env?: EnvOverrides;
}): ApiProvider;
//# sourceMappingURL=envoy.d.ts.map