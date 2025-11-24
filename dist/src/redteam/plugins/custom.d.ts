import { z } from 'zod';
import { RedteamPluginBase } from './base';
import type { ApiProvider, Assertion } from '../../types/index';
declare const CustomPluginDefinitionSchema: z.ZodObject<{
    generator: z.ZodString;
    grader: z.ZodString;
    threshold: z.ZodOptional<z.ZodNumber>;
    metric: z.ZodOptional<z.ZodString>;
    id: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    grader: string;
    generator: string;
    id?: string | undefined;
    threshold?: number | undefined;
    metric?: string | undefined;
}, {
    grader: string;
    generator: string;
    id?: string | undefined;
    threshold?: number | undefined;
    metric?: string | undefined;
}>;
type CustomPluginDefinition = z.infer<typeof CustomPluginDefinitionSchema>;
export declare function loadCustomPluginDefinition(filePath: string): CustomPluginDefinition;
export declare class CustomPlugin extends RedteamPluginBase {
    private definition;
    static readonly canGenerateRemote = false;
    get id(): string;
    constructor(provider: ApiProvider, purpose: string, injectVar: string, filePath: string);
    protected getTemplate(): Promise<string>;
    protected getMetricName(): string;
    protected getAssertions(_prompt: string): Assertion[];
}
export {};
//# sourceMappingURL=custom.d.ts.map