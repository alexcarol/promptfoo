import type { ApiProvider, CallApiContextParams, CallApiOptionsParams, ProviderOptions, ProviderResponse } from '../../types/providers';
interface AuthoritativeMarkupInjectionConfig {
    injectVar: string;
}
export default class AuthoritativeMarkupInjectionProvider implements ApiProvider {
    readonly config: AuthoritativeMarkupInjectionConfig;
    id(): string;
    constructor(options?: ProviderOptions & {
        injectVar?: string;
    });
    callApi(_prompt: string, context?: CallApiContextParams, options?: CallApiOptionsParams): Promise<ProviderResponse>;
}
export {};
//# sourceMappingURL=authoritativeMarkupInjection.d.ts.map