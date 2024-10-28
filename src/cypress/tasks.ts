import { EvidenceCollection } from "../context";
import { getTestIssueKeys } from "../hooks/after/util";
import { XrayEvidenceItem } from "../types/xray/import-test-execution-results";
import { dedent } from "../util/dedent";
import { errorMessage } from "../util/errors";
import { Level, Logger } from "../util/logging";

/**
 * All tasks which are available within the plugin.
 */
export type PluginTask = "cypress-xray-plugin:add-evidence";

/**
 * Enqueues the plugin task for adding evidence to the test from which the task was called. The
 * evidence will be attached to the test results of the test execution.
 *
 * The following two code snippets are identical in function:
 *
 * ```ts
 * // Plugin task wrapper:
 * it("attaches evidence CYP-100", () => {
 *   enqueueTask("cypress-xray-plugin:add-evidence", { data: "hello", filename: "hello.txt" });
 * });
 *
 * // Explicit task call:
 * it("attaches evidence CYP-100", () => {
 *   cy.task("cypress-xray-plugin:add-evidence", {
 *     evidence: { data: "hello", filename: "hello.txt" },
 *     test: Cypress.currentTest.title
 *   });
 * });
 * ```
 *
 * If you want to attach the results to a different test, you will need to call the task explicitly.
 * For example, the following snippet appends the evidence to the results of `CYP-42` rather than
 * to `CYP-100` in which the task was called.
 *
 * ```ts
 * it("attaches evidence CYP-100", () => {
 *   cy.task("cypress-xray-plugin:add-evidence", {
 *     evidence: { ... },
 *     test: "CYP-42"
 *   });
 * });
 * ```
 *
 * @param task - the task name
 * @param evidence - the evidence
 *
 * @see https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/addingEvidence/
 */
export function enqueueTask(
    task: "cypress-xray-plugin:add-evidence",
    evidence: XrayEvidenceItem
): Cypress.Chainable<XrayEvidenceItem>;

// Implementation.
export function enqueueTask<T>(task: PluginTask, arg: T): Cypress.Chainable<T> {
    switch (task) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        case "cypress-xray-plugin:add-evidence": {
            return cy.task(task, {
                evidence: arg,
                test: Cypress.currentTest.title,
            });
        }
    }
}

export class PluginTaskListener {
    private readonly projectKey: string;
    private readonly evidenceCollection: EvidenceCollection;
    private readonly logger: Logger;
    private readonly ignoredTests = new Set<string>();

    constructor(projectKey: string, evidenceCollection: EvidenceCollection, logger: Logger) {
        this.projectKey = projectKey;
        this.evidenceCollection = evidenceCollection;
        this.logger = logger;
    }

    public addEvidence(args: { evidence: XrayEvidenceItem; test: string }): XrayEvidenceItem {
        try {
            const issueKeys = getTestIssueKeys(args.test, this.projectKey);
            for (const issueKey of issueKeys) {
                this.evidenceCollection.addEvidence(issueKey, args.evidence);
            }
        } catch (error: unknown) {
            if (!this.ignoredTests.has(args.test)) {
                this.logger.message(
                    Level.WARNING,
                    dedent(`
                        Test: ${args.test}

                          Encountered an error while trying to add evidence.

                            Caused by: ${errorMessage(error)}
                    `)
                );
                this.ignoredTests.add(args.test);
            }
        }
        return args.evidence;
    }
}
