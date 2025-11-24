import { z } from 'zod';
export declare const ApiSchemas: {
    User: {
        Get: {
            Response: z.ZodObject<{
                email: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                email: string | null;
            }, {
                email: string | null;
            }>;
        };
        GetId: {
            Response: z.ZodObject<{
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
            }, {
                id: string;
            }>;
        };
        Update: {
            Request: z.ZodObject<{
                email: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                email: string;
            }, {
                email: string;
            }>;
            Response: z.ZodObject<{
                success: z.ZodBoolean;
                message: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                message: string;
                success: boolean;
            }, {
                message: string;
                success: boolean;
            }>;
        };
        EmailStatus: {
            Response: z.ZodObject<{
                hasEmail: z.ZodBoolean;
                email: z.ZodOptional<z.ZodString>;
                status: z.ZodEnum<["ok", "exceeded_limit", "show_usage_warning", "no_email", "risky_email", "disposable_email"]>;
                message: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                status: "ok" | "exceeded_limit" | "show_usage_warning" | "risky_email" | "disposable_email" | "no_email";
                hasEmail: boolean;
                message?: string | undefined;
                email?: string | undefined;
            }, {
                status: "ok" | "exceeded_limit" | "show_usage_warning" | "risky_email" | "disposable_email" | "no_email";
                hasEmail: boolean;
                message?: string | undefined;
                email?: string | undefined;
            }>;
        };
    };
    Eval: {
        UpdateAuthor: {
            Params: z.ZodObject<{
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
            }, {
                id: string;
            }>;
            Request: z.ZodObject<{
                author: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                author: string;
            }, {
                author: string;
            }>;
            Response: z.ZodObject<{
                message: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                message: string;
            }, {
                message: string;
            }>;
        };
        MetadataKeys: {
            Params: z.ZodObject<{
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
            }, {
                id: string;
            }>;
            Query: z.ZodObject<{
                comparisonEvalIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                comparisonEvalIds?: string[] | undefined;
            }, {
                comparisonEvalIds?: string[] | undefined;
            }>;
            Response: z.ZodObject<{
                keys: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                keys: string[];
            }, {
                keys: string[];
            }>;
        };
        MetadataValues: {
            Params: z.ZodObject<{
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
            }, {
                id: string;
            }>;
            Query: z.ZodObject<{
                key: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                key: string;
            }, {
                key: string;
            }>;
            Response: z.ZodObject<{
                values: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                values: string[];
            }, {
                values: string[];
            }>;
        };
        Copy: {
            Params: z.ZodObject<{
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
            }, {
                id: string;
            }>;
            Request: z.ZodObject<{
                description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                description?: string | undefined;
            }, {
                description?: string | undefined;
            }>;
            Response: z.ZodObject<{
                id: z.ZodString;
                distinctTestCount: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                id: string;
                distinctTestCount: number;
            }, {
                id: string;
                distinctTestCount: number;
            }>;
        };
    };
};
//# sourceMappingURL=apiSchemas.d.ts.map