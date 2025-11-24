/**
 * Test for the --filter-failing bug where test.vars gets mutated
 * during evaluation, causing mismatches when trying to filter failing tests.
 *
 * Bug: When evaluation adds runtime vars like _conversation to test.vars,
 * it mutates the original test object. This mutated test is stored in results.
 * On subsequent runs with --filter-failing, freshly loaded tests don't have
 * these runtime vars, so deepEqual comparison fails.
 */
export {};
//# sourceMappingURL=filterFailingBug.test.d.ts.map