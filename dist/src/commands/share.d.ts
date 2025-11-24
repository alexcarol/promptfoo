import Eval from '../models/eval';
import ModelAudit from '../models/modelAudit';
import type { Command } from 'commander';
export declare function notCloudEnabledShareInstructions(): void;
export declare function createAndDisplayShareableUrl(evalRecord: Eval, showAuth: boolean): Promise<string | null>;
export declare function createAndDisplayShareableModelAuditUrl(auditRecord: ModelAudit, showAuth: boolean): Promise<string | null>;
export declare function shareCommand(program: Command): void;
//# sourceMappingURL=share.d.ts.map