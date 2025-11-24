import { type Command } from 'commander';
import { z } from 'zod';
import type { ApiProvider, Prompt, UnifiedConfig } from '../../types/index';
export declare const TargetPurposeDiscoveryRequestSchema: z.ZodObject<{
    state: z.ZodObject<{
        currentQuestionIndex: z.ZodNumber;
        answers: z.ZodArray<z.ZodAny, "many">;
    }, "strip", z.ZodTypeAny, {
        currentQuestionIndex: number;
        answers: any[];
    }, {
        currentQuestionIndex: number;
        answers: any[];
    }>;
    task: z.ZodLiteral<"target-purpose-discovery">;
    version: z.ZodString;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    version: string;
    task: "target-purpose-discovery";
    state: {
        currentQuestionIndex: number;
        answers: any[];
    };
    email?: string | null | undefined;
}, {
    version: string;
    task: "target-purpose-discovery";
    state: {
        currentQuestionIndex: number;
        answers: any[];
    };
    email?: string | null | undefined;
}>;
declare const TargetPurposeDiscoveryResultSchema: z.ZodObject<{
    purpose: z.ZodNullable<z.ZodString>;
    limitations: z.ZodNullable<z.ZodString>;
    user: z.ZodNullable<z.ZodString>;
    tools: z.ZodArray<z.ZodNullable<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        arguments: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            type: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: string;
            name: string;
            description: string;
        }, {
            type: string;
            name: string;
            description: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        arguments: {
            type: string;
            name: string;
            description: string;
        }[];
    }, {
        name: string;
        description: string;
        arguments: {
            type: string;
            name: string;
            description: string;
        }[];
    }>>, "many">;
}, "strip", z.ZodTypeAny, {
    purpose: string | null;
    user: string | null;
    tools: ({
        name: string;
        description: string;
        arguments: {
            type: string;
            name: string;
            description: string;
        }[];
    } | null)[];
    limitations: string | null;
}, {
    purpose: string | null;
    user: string | null;
    tools: ({
        name: string;
        description: string;
        arguments: {
            type: string;
            name: string;
            description: string;
        }[];
    } | null)[];
    limitations: string | null;
}>;
export declare const TargetPurposeDiscoveryTaskResponseSchema: z.ZodObject<{
    done: z.ZodBoolean;
    question: z.ZodOptional<z.ZodString>;
    purpose: z.ZodOptional<z.ZodObject<{
        purpose: z.ZodNullable<z.ZodString>;
        limitations: z.ZodNullable<z.ZodString>;
        user: z.ZodNullable<z.ZodString>;
        tools: z.ZodArray<z.ZodNullable<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            arguments: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                type: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: string;
                name: string;
                description: string;
            }, {
                type: string;
                name: string;
                description: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            name: string;
            description: string;
            arguments: {
                type: string;
                name: string;
                description: string;
            }[];
        }, {
            name: string;
            description: string;
            arguments: {
                type: string;
                name: string;
                description: string;
            }[];
        }>>, "many">;
    }, "strip", z.ZodTypeAny, {
        purpose: string | null;
        user: string | null;
        tools: ({
            name: string;
            description: string;
            arguments: {
                type: string;
                name: string;
                description: string;
            }[];
        } | null)[];
        limitations: string | null;
    }, {
        purpose: string | null;
        user: string | null;
        tools: ({
            name: string;
            description: string;
            arguments: {
                type: string;
                name: string;
                description: string;
            }[];
        } | null)[];
        limitations: string | null;
    }>>;
    state: z.ZodObject<{
        currentQuestionIndex: z.ZodNumber;
        answers: z.ZodArray<z.ZodAny, "many">;
    }, "strip", z.ZodTypeAny, {
        currentQuestionIndex: number;
        answers: any[];
    }, {
        currentQuestionIndex: number;
        answers: any[];
    }>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    done: boolean;
    state: {
        currentQuestionIndex: number;
        answers: any[];
    };
    error?: string | undefined;
    purpose?: {
        purpose: string | null;
        user: string | null;
        tools: ({
            name: string;
            description: string;
            arguments: {
                type: string;
                name: string;
                description: string;
            }[];
        } | null)[];
        limitations: string | null;
    } | undefined;
    question?: string | undefined;
}, {
    done: boolean;
    state: {
        currentQuestionIndex: number;
        answers: any[];
    };
    error?: string | undefined;
    purpose?: {
        purpose: string | null;
        user: string | null;
        tools: ({
            name: string;
            description: string;
            arguments: {
                type: string;
                name: string;
                description: string;
            }[];
        } | null)[];
        limitations: string | null;
    } | undefined;
    question?: string | undefined;
}>;
export declare const ArgsSchema: z.ZodEffects<z.ZodObject<{
    config: z.ZodOptional<z.ZodString>;
    target: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    config?: string | undefined;
    target?: string | undefined;
}, {
    config?: string | undefined;
    target?: string | undefined;
}>, {
    config?: string | undefined;
    target?: string | undefined;
}, {
    config?: string | undefined;
    target?: string | undefined;
}>;
export type TargetPurposeDiscoveryResult = z.infer<typeof TargetPurposeDiscoveryResultSchema>;
/**
 * Normalizes a TargetPurposeDiscoveryResult by converting null-like values to actual null
 * and cleaning up empty or meaningless content.
 */
export declare function normalizeTargetPurposeDiscoveryResult(result: TargetPurposeDiscoveryResult): TargetPurposeDiscoveryResult;
/**
 * Queries Cloud for the purpose-discovery logic, sends each logic to the target,
 * and summarizes the results.
 *
 * @param target - The target API provider.
 * @param prompt - The prompt to use for the discovery.
 * @param showProgress - Whether to show the progress bar.
 * @returns The discovery result.
 */
export declare function doTargetPurposeDiscovery(target: ApiProvider, prompt?: Prompt, showProgress?: boolean): Promise<TargetPurposeDiscoveryResult | undefined>;
/**
 * Registers the `discover` command with the CLI.
 */
export declare function discoverCommand(program: Command, defaultConfig: Partial<UnifiedConfig>, defaultConfigPath: string | undefined): void;
export {};
//# sourceMappingURL=discover.d.ts.map