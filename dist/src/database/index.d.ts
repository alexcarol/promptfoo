import Database from 'better-sqlite3';
import { type LogWriter } from 'drizzle-orm/logger';
export declare class DrizzleLogWriter implements LogWriter {
    write(message: string): void;
}
export declare function getDbPath(): string;
export declare function getDbSignalPath(): string;
export declare function getDb(): import("drizzle-orm/better-sqlite3").BetterSQLite3Database<Record<string, unknown>> & {
    $client: Database.Database;
};
export declare function closeDb(): void;
/**
 * Check if the database is currently open
 */
export declare function isDbOpen(): boolean;
//# sourceMappingURL=index.d.ts.map