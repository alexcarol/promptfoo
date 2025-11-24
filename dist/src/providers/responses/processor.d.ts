import type { ProviderResponse } from '../../types/index';
import type { ProcessorConfig } from './types';
/**
 * Shared response processor for OpenAI and Azure Responses APIs.
 * Handles all response types with identical logic to ensure feature parity.
 */
export declare class ResponsesProcessor {
    private config;
    constructor(config: ProcessorConfig);
    processResponseOutput(data: any, requestConfig: any, cached: boolean): Promise<ProviderResponse>;
    private processOutput;
    private processOutputItem;
    private processFunctionCall;
    private processMessage;
    private processToolResult;
    private processReasoning;
    private processWebSearch;
    private processCodeInterpreter;
    private processMcpListTools;
    private processMcpCall;
    private processMcpApprovalRequest;
}
//# sourceMappingURL=processor.d.ts.map