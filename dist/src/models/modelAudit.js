"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScanId = createScanId;
const drizzle_orm_1 = require("drizzle-orm");
const index_1 = require("../database/index");
const tables_1 = require("../database/tables");
const logger_1 = __importDefault(require("../logger"));
const createHash_1 = require("../util/createHash");
function createScanId(createdAt = new Date()) {
    return `scan-${(0, createHash_1.randomSequence)(3)}-${createdAt.toISOString().slice(0, 19)}`;
}
class ModelAudit {
    constructor(data) {
        const createdAtDate = data.createdAt ? new Date(data.createdAt) : new Date();
        this.id = data.id || createScanId(createdAtDate);
        this.createdAt = data.createdAt || Date.now();
        this.updatedAt = data.updatedAt || Date.now();
        this.name = data.name;
        this.author = data.author;
        this.modelPath = data.modelPath || '';
        this.modelType = data.modelType;
        this.results = data.results || {};
        this.checks = data.checks || data.results?.checks || null;
        this.issues = data.issues || data.results?.issues || null;
        // Ensure hasErrors is properly set based on actual critical/error findings
        const issues = data.issues || data.results?.issues;
        const resultsHasErrors = data.results?.has_errors ?? false;
        // If hasErrors is explicitly provided, use it; otherwise compute from results and issues
        if (data.hasErrors !== undefined) {
            this.hasErrors = data.hasErrors;
        }
        else {
            const hasActualErrors = resultsHasErrors ||
                (issues &&
                    issues.some((issue) => issue.severity === 'critical' || issue.severity === 'error')) ||
                false;
            this.hasErrors = hasActualErrors;
        }
        this.totalChecks = data.totalChecks;
        this.passedChecks = data.passedChecks;
        this.failedChecks = data.failedChecks;
        this.metadata = data.metadata;
        // Revision tracking
        this.modelId = data.modelId;
        this.revisionSha = data.revisionSha;
        this.contentHash = data.contentHash;
        this.modelSource = data.modelSource;
        this.sourceLastModified = data.sourceLastModified;
        this.scannerVersion = data.scannerVersion;
        this.persisted = data.persisted || false;
    }
    static async create(params) {
        const now = Date.now();
        const createdAtDate = new Date(now);
        const id = createScanId(createdAtDate);
        // Ensure hasErrors is properly set based on actual critical/error findings
        const hasActualErrors = Boolean(params.results.has_errors ||
            (params.results.issues &&
                params.results.issues.some((issue) => issue.severity === 'critical' || issue.severity === 'error')));
        const data = {
            id,
            createdAt: now,
            updatedAt: now,
            name: params.name || null,
            author: params.author || null,
            modelPath: params.modelPath,
            modelType: params.modelType || null,
            results: params.results,
            checks: params.results.checks || null,
            issues: params.results.issues || null,
            hasErrors: hasActualErrors,
            totalChecks: params.results.total_checks || null,
            passedChecks: params.results.passed_checks || null,
            failedChecks: params.results.failed_checks || null,
            metadata: params.metadata || null,
            // Revision tracking
            modelId: params.modelId || null,
            revisionSha: params.revisionSha ?? null,
            contentHash: params.contentHash || null,
            modelSource: params.modelSource || null,
            sourceLastModified: params.sourceLastModified || null,
            scannerVersion: params.scannerVersion || null,
        };
        const db = (0, index_1.getDb)();
        db.insert(tables_1.modelAuditsTable).values(data).run();
        logger_1.default.debug(`Created model audit ${id} for ${params.modelPath}`);
        return new ModelAudit({ ...data, persisted: true });
    }
    static async findById(id) {
        const db = (0, index_1.getDb)();
        const result = await db
            .select()
            .from(tables_1.modelAuditsTable)
            .where((0, drizzle_orm_1.eq)(tables_1.modelAuditsTable.id, id))
            .get();
        if (!result) {
            return null;
        }
        return new ModelAudit({ ...result, persisted: true });
    }
    static async findByModelPath(modelPath) {
        const db = (0, index_1.getDb)();
        const results = await db
            .select()
            .from(tables_1.modelAuditsTable)
            .where((0, drizzle_orm_1.eq)(tables_1.modelAuditsTable.modelPath, modelPath))
            .orderBy(tables_1.modelAuditsTable.createdAt)
            .all();
        return results.map((r) => new ModelAudit({ ...r, persisted: true }));
    }
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
    static async findByRevision(modelId, revisionSha, contentHash) {
        const db = (0, index_1.getDb)();
        // Build query conditions based on available fields
        const conditions = [];
        // If we have revision_sha, check (modelId, revisionSha)
        if (revisionSha) {
            conditions.push((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(tables_1.modelAuditsTable.modelId, modelId), (0, drizzle_orm_1.eq)(tables_1.modelAuditsTable.revisionSha, revisionSha), (0, drizzle_orm_1.isNotNull)(tables_1.modelAuditsTable.revisionSha)));
        }
        // If we have contentHash, check (modelId, contentHash)
        if (contentHash) {
            conditions.push((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(tables_1.modelAuditsTable.modelId, modelId), (0, drizzle_orm_1.eq)(tables_1.modelAuditsTable.contentHash, contentHash)));
        }
        // If no conditions, return null
        if (conditions.length === 0) {
            return null;
        }
        // Query with OR condition (check either revision_sha or content_hash)
        const result = await db
            .select()
            .from(tables_1.modelAuditsTable)
            .where((0, drizzle_orm_1.or)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(tables_1.modelAuditsTable.createdAt))
            .get();
        if (!result) {
            return null;
        }
        logger_1.default.debug(`Found existing scan for ${modelId} (id: ${result.id})`);
        return new ModelAudit({ ...result, persisted: true });
    }
    static async getMany(limit = 100) {
        const db = (0, index_1.getDb)();
        const results = await db
            .select()
            .from(tables_1.modelAuditsTable)
            .orderBy((0, drizzle_orm_1.desc)(tables_1.modelAuditsTable.createdAt))
            .limit(limit)
            .all();
        return results.map((r) => new ModelAudit({ ...r, persisted: true }));
    }
    static async getLatest(limit = 10) {
        const db = (0, index_1.getDb)();
        const results = await db
            .select()
            .from(tables_1.modelAuditsTable)
            .orderBy((0, drizzle_orm_1.desc)(tables_1.modelAuditsTable.createdAt))
            .limit(limit)
            .all();
        return results.map((r) => new ModelAudit({ ...r, persisted: true }));
    }
    /**
     * Get the most recent model audit scan.
     * @returns The latest model audit or undefined if none exists.
     */
    static async latest() {
        return (await this.getLatest(1))[0];
    }
    async save() {
        const db = (0, index_1.getDb)();
        const now = Date.now();
        if (this.persisted) {
            await db
                .update(tables_1.modelAuditsTable)
                .set({
                name: this.name,
                author: this.author,
                modelPath: this.modelPath,
                modelType: this.modelType,
                results: this.results,
                checks: this.results?.checks || null,
                issues: this.results?.issues || null,
                hasErrors: this.hasErrors,
                totalChecks: this.totalChecks,
                passedChecks: this.passedChecks,
                failedChecks: this.failedChecks,
                metadata: this.metadata,
                // Revision tracking
                modelId: this.modelId,
                revisionSha: this.revisionSha,
                contentHash: this.contentHash,
                modelSource: this.modelSource,
                sourceLastModified: this.sourceLastModified,
                scannerVersion: this.scannerVersion,
                updatedAt: now,
            })
                .where((0, drizzle_orm_1.eq)(tables_1.modelAuditsTable.id, this.id))
                .run();
        }
        else {
            await db
                .insert(tables_1.modelAuditsTable)
                .values({
                id: this.id,
                name: this.name,
                author: this.author,
                modelPath: this.modelPath,
                modelType: this.modelType,
                results: this.results,
                checks: this.results?.checks || null,
                issues: this.results?.issues || null,
                hasErrors: this.hasErrors,
                totalChecks: this.totalChecks,
                passedChecks: this.passedChecks,
                failedChecks: this.failedChecks,
                metadata: this.metadata,
                // Revision tracking
                modelId: this.modelId,
                revisionSha: this.revisionSha,
                contentHash: this.contentHash,
                modelSource: this.modelSource,
                sourceLastModified: this.sourceLastModified,
                scannerVersion: this.scannerVersion,
                createdAt: this.createdAt || now,
                updatedAt: now,
            })
                .run();
            this.persisted = true;
        }
    }
    async delete() {
        if (!this.persisted) {
            return;
        }
        const db = (0, index_1.getDb)();
        db.delete(tables_1.modelAuditsTable).where((0, drizzle_orm_1.eq)(tables_1.modelAuditsTable.id, this.id)).run();
        this.persisted = false;
    }
    toJSON() {
        return {
            id: this.id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            name: this.name,
            modelPath: this.modelPath,
            modelType: this.modelType,
            results: this.results,
            hasErrors: this.hasErrors,
            totalChecks: this.totalChecks,
            passedChecks: this.passedChecks,
            failedChecks: this.failedChecks,
            metadata: this.metadata,
        };
    }
}
exports.default = ModelAudit;
//# sourceMappingURL=modelAudit.js.map