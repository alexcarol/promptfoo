import type { ApiProvider, CallApiContextParams, CallApiOptionsParams } from '../../types/index';
declare class RedteamIterativeProvider implements ApiProvider {
    readonly config: Record<string, string | object>;
    private readonly redteamProvider;
    constructor(config: Record<string, string | object>);
    id(): string;
    callApi(_prompt: string, context?: CallApiContextParams & {
        injectVar?: string;
    }, options?: CallApiOptionsParams): Promise<{
        error?: string | undefined;
        output: string | undefined;
        metadata: {
            finalIteration: number;
            highestScore: number;
            redteamHistory: {
                role: "user" | "assistant" | "system";
                content: string;
            }[];
            redteamFinalPrompt: string | undefined;
            bestImageUrl: string | undefined;
            bestImageDescription: string | undefined;
        };
        tokenUsage: {
            prompt?: number | undefined;
            completion?: number | undefined;
            cached?: number | undefined;
            total?: number | undefined;
            numRequests?: number | undefined;
            completionDetails?: {
                reasoning?: number | undefined;
                acceptedPrediction?: number | undefined;
                rejectedPrediction?: number | undefined;
            } | undefined;
            assertions?: {
                prompt?: number | undefined;
                completion?: number | undefined;
                cached?: number | undefined;
                total?: number | undefined;
                numRequests?: number | undefined;
                completionDetails?: {
                    reasoning?: number | undefined;
                    acceptedPrediction?: number | undefined;
                    rejectedPrediction?: number | undefined;
                } | undefined;
            } | undefined;
        };
    }>;
}
export default RedteamIterativeProvider;
//# sourceMappingURL=iterativeImage.d.ts.map