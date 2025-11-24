import type { UnifiedConfig } from './types/index';
interface CliState {
    basePath?: string;
    config?: Partial<UnifiedConfig>;
    remote?: boolean;
    webUI?: boolean;
    resume?: boolean;
    debugLogFile?: string;
    errorLogFile?: string;
    postActionCallback?: () => Promise<void>;
}
declare const state: CliState;
export default state;
//# sourceMappingURL=cliState.d.ts.map