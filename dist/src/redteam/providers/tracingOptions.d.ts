import type { AtomicTestCase } from '../../types/index';
export interface RedteamTracingOptions {
    enabled: boolean;
    includeInAttack: boolean;
    includeInGrading: boolean;
    includeInternalSpans: boolean;
    maxSpans?: number;
    maxDepth?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    spanFilter?: string[];
    sanitizeAttributes: boolean;
}
export type RawTracingConfig = Partial<Pick<RedteamTracingOptions, 'enabled' | 'includeInAttack' | 'includeInGrading' | 'includeInternalSpans' | 'maxSpans' | 'maxDepth' | 'maxRetries' | 'retryDelayMs' | 'spanFilter' | 'sanitizeAttributes'>> & {
    strategies?: Record<string, RawTracingConfig>;
};
export declare function resolveTracingOptions({ strategyId, test, config, }: {
    strategyId: string;
    test?: AtomicTestCase;
    config?: Record<string, unknown>;
}): RedteamTracingOptions;
//# sourceMappingURL=tracingOptions.d.ts.map