"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiSchemas = void 0;
const zod_1 = require("zod");
const EmailSchema = zod_1.z.string().email();
exports.ApiSchemas = {
    User: {
        Get: {
            Response: zod_1.z.object({
                email: EmailSchema.nullable(),
            }),
        },
        GetId: {
            Response: zod_1.z.object({
                id: zod_1.z.string(),
            }),
        },
        Update: {
            Request: zod_1.z.object({
                email: EmailSchema,
            }),
            Response: zod_1.z.object({
                success: zod_1.z.boolean(),
                message: zod_1.z.string(),
            }),
        },
        EmailStatus: {
            Response: zod_1.z.object({
                hasEmail: zod_1.z.boolean(),
                email: EmailSchema.optional(),
                status: zod_1.z.enum([
                    'ok',
                    'exceeded_limit',
                    'show_usage_warning',
                    'no_email',
                    'risky_email',
                    'disposable_email',
                ]),
                message: zod_1.z.string().optional(),
            }),
        },
    },
    Eval: {
        UpdateAuthor: {
            Params: zod_1.z.object({
                id: zod_1.z.string(),
            }),
            Request: zod_1.z.object({
                author: zod_1.z.string().email(),
            }),
            Response: zod_1.z.object({
                message: zod_1.z.string(),
            }),
        },
        MetadataKeys: {
            Params: zod_1.z.object({
                id: zod_1.z.string().min(3).max(128),
            }),
            Query: zod_1.z.object({
                comparisonEvalIds: zod_1.z.array(zod_1.z.string()).optional(),
            }),
            Response: zod_1.z.object({
                keys: zod_1.z.array(zod_1.z.string()),
            }),
        },
        MetadataValues: {
            Params: zod_1.z.object({
                id: zod_1.z.string().min(3).max(128),
            }),
            Query: zod_1.z.object({
                key: zod_1.z.string().min(1),
            }),
            Response: zod_1.z.object({
                values: zod_1.z.array(zod_1.z.string()),
            }),
        },
        Copy: {
            Params: zod_1.z.object({
                id: zod_1.z.string(),
            }),
            Request: zod_1.z.object({
                description: zod_1.z.string().optional(),
            }),
            Response: zod_1.z.object({
                id: zod_1.z.string(),
                distinctTestCount: zod_1.z.number(),
            }),
        },
    },
};
//# sourceMappingURL=apiSchemas.js.map