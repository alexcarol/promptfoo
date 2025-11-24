import type { ModelAuditScanResults } from '../types/modelAudit';
export declare function createScanId(createdAt?: Date): string;
export interface ModelAuditRecord {
    id: string;
    createdAt: number;
    updatedAt: number;
    name?: string | null;
    author?: string | null;
    modelPath: string;
    modelType?: string | null;
    results: ModelAuditScanResults;
    checks?: ModelAuditScanResults['checks'] | null;
    issues?: ModelAuditScanResults['issues'] | null;
    hasErrors: boolean;
    totalChecks?: number | null;
    passedChecks?: number | null;
    failedChecks?: number | null;
    metadata?: Record<string, any> | null;
    modelId?: string | null;
    revisionSha?: string | null;
    contentHash?: string | null;
    modelSource?: string | null;
    sourceLastModified?: number | null;
    scannerVersion?: string | null;
}
export default class ModelAudit {
    id: string;
    createdAt: number;
    updatedAt: number;
    name?: string | null;
    author?: string | null;
    modelPath: string;
    modelType?: string | null;
    results: ModelAuditScanResults;
    checks?: ModelAuditScanResults['checks'] | null;
    issues?: ModelAuditScanResults['issues'] | null;
    hasErrors: boolean;
    totalChecks?: number | null;
    passedChecks?: number | null;
    failedChecks?: number | null;
    metadata?: Record<string, any> | null;
    modelId?: string | null;
    revisionSha?: string | null;
    contentHash?: string | null;
    modelSource?: string | null;
    sourceLastModified?: number | null;
    scannerVersion?: string | null;
    persisted: boolean;
    constructor(data: Partial<ModelAuditRecord> & {
        persisted?: boolean;
    });
    static create(params: {
        name?: string;
        author?: string;
        modelPath: string;
        modelType?: string;
        results: ModelAuditScanResults;
        metadata?: Record<string, any>;
        modelId?: string;
        revisionSha?: string | null;
        contentHash?: string;
        modelSource?: string;
        sourceLastModified?: number;
        scannerVersion?: string;
    }): Promise<ModelAudit>;
    static findById(id: string): Promise<ModelAudit | null>;
    static findByModelPath(modelPath: string): Promise<ModelAudit[]>;
    /**
     * Find existing model audit by revision information for deduplication.
     * Checks both revision_sha and content_hash based on availability.
     *
     * Strategy:
     * 1. If revisionSha provided, check (modelId, revisionSha) first (fast path for HF)
     * 2. If not found, check (modelId, contentHash) as fallback
     *
     * @param modelId - Normalized model identifier
     * @param revisionSha - Native revision (HF Git SHA, S3 version ID, etc.) - optional
     * @param contentHash - SHA-256 of actual content - optional
     * @returns Existing ModelAudit or null if not found
     */
    static findByRevision(modelId: string, revisionSha?: string | null, contentHash?: string): Promise<ModelAudit | null>;
    static getMany(limit?: number): Promise<ModelAudit[]>;
    static getLatest(limit?: number): Promise<ModelAudit[]>;
    /**
     * Get the most recent model audit scan.
     * @returns The latest model audit or undefined if none exists.
     */
    static latest(): Promise<ModelAudit | undefined>;
    save(): Promise<void>;
    delete(): Promise<void>;
    toJSON(): ModelAuditRecord;
}
//# sourceMappingURL=modelAudit.d.ts.map