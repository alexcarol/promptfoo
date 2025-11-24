import { type EvaluateTable } from './types/index';
export declare function generateTable(evaluateTable: EvaluateTable, tableCellMaxLength?: number, maxRows?: number): string;
export declare function wrapTable(rows: Record<string, string | number>[], columnWidths?: Record<string, number>): string;
//# sourceMappingURL=table.d.ts.map