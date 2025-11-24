import { type UnifiedConfig } from '../../types/index';
import type { Command } from 'commander';
interface DatasetGenerateOptions {
    cache: boolean;
    config?: string;
    envFile?: string;
    instructions?: string;
    numAssertions?: string;
    output?: string;
    provider?: string;
    write: boolean;
    defaultConfig: Partial<UnifiedConfig>;
    defaultConfigPath: string | undefined;
    type: 'pi' | 'g-eval' | 'llm-rubric';
}
export declare function doGenerateAssertions(options: DatasetGenerateOptions): Promise<void>;
export declare function generateAssertionsCommand(program: Command, defaultConfig: Partial<UnifiedConfig>, defaultConfigPath: string | undefined): void;
export {};
//# sourceMappingURL=assertions.d.ts.map