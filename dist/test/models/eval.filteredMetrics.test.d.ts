/**
 * CRITICAL TEST: WHERE clause consistency between pagination and metrics.
 *
 * This test ensures that queryTestIndices() and getFilteredMetrics() use
 * the EXACT SAME WHERE clause logic, preventing silent data corruption where
 * metrics don't match the displayed results.
 *
 * If these tests fail, it means the two methods have diverged and metrics
 * will be inaccurate!
 */
export {};
//# sourceMappingURL=eval.filteredMetrics.test.d.ts.map