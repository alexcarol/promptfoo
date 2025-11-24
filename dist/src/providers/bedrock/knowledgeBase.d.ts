import { AwsBedrockGenericProvider } from './index';
import type { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime';
import type { EnvOverrides } from '../../types/env';
import type { ApiProvider, ProviderResponse } from '../../types/providers';
interface BedrockKnowledgeBaseOptions {
    accessKeyId?: string;
    apiKey?: string;
    profile?: string;
    region?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    knowledgeBaseId: string;
    modelArn?: string;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    top_k?: number;
}
/**
 * AWS Bedrock Knowledge Base provider for RAG (Retrieval Augmented Generation).
 * Allows querying an existing AWS Bedrock Knowledge Base with text queries.
 */
export declare class AwsBedrockKnowledgeBaseProvider extends AwsBedrockGenericProvider implements ApiProvider {
    knowledgeBaseClient?: BedrockAgentRuntimeClient;
    kbConfig: BedrockKnowledgeBaseOptions;
    constructor(modelName: string, options?: {
        config?: BedrockKnowledgeBaseOptions;
        id?: string;
        env?: EnvOverrides;
    });
    id(): string;
    toString(): string;
    getKnowledgeBaseClient(): Promise<BedrockAgentRuntimeClient>;
    callApi(prompt: string): Promise<ProviderResponse>;
}
export {};
//# sourceMappingURL=knowledgeBase.d.ts.map