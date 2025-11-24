import type { ApiProvider, ProviderOptions } from '../types/index';
export declare function isPackagePath(path: any): path is string;
export declare function loadFromPackage(packageInstancePath: string, basePath: string): Promise<any>;
export declare function parsePackageProvider(providerPath: string, basePath: string, options: ProviderOptions): Promise<ApiProvider>;
//# sourceMappingURL=packageParser.d.ts.map