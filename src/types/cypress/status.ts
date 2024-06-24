/**
 * All test statuses Cypress assigns to test attempts.
 */
export enum CypressStatus {
    /**
     * A test marked as failed.
     *
     * @see https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests#Failed
     */
    FAILED = "failed",
    /**
     * A test marked as passed.
     *
     * @see https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests#Passed
     */
    PASSED = "passed",
    /**
     * A test marked as pending.
     *
     * @see https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests#Pending
     */
    PENDING = "pending",
    /**
     * A test marked as skipped.
     *
     * @see https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests#Skipped
     */
    SKIPPED = "skipped",
}
