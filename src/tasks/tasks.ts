import { EvidenceCollection } from "../context";
import { getTestIssueKeys } from "../hooks/after/util";
import { dedent } from "../util/dedent";
import { errorMessage } from "../util/errors";
import { Level, Logger } from "../util/logging";

/**
 * All tasks which are available within the plugin.
 */
export type PluginTask = "cypress-xray-plugin:add-evidence";

/**
 * Represents a file to be uploaded as evidence.
 *
 * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results#ImportExecutionResults-%22evidence%22object-embeddedattachments
 * @see https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results#UsingXrayJSONformattoimportexecutionresults-%22evidence%22object-embeddedattachments
 */
interface Evidence {
    /**
     * The MIME type of the file, which helps Xray understand the file format.
     *
     * @example "image/png"
     *
     * @example "application/json"
     */
    contentType?: string;
    /**
     * The binary data of the file to be uploaded.
     *
     * @example Buffer.from("hello.txt")
     *
     * @example
     *
     * ```ts
     * Buffer.from(JSON.stringify({ name: "Jeff" }))
     * ```
     */
    data: Buffer;
    /**
     * The name of the evidence file, including its extension
     *
     * @example "example.png"
     */
    filename: string;
}

/**
 * Enqueues the plugin task for adding evidence to the test from which the task was called. The
 * evidence will be attached to the test results of the test execution.
 *
 * This function is a convenient typesafe wrapper around `cy.task`, i.e. the following two code
 * snippets are identical in function:
 *
 * ```ts
 * // Plugin task wrapper:
 * it("attaches evidence CYP-100", () => {
 *   enqueueTask("cypress-xray-plugin:add-evidence", {
 *     data: Buffer.from("hello"),
 *     filename: "hello.txt"
 *   });
 * });
 *
 * // Explicit task call:
 * it("attaches evidence CYP-100", () => {
 *   cy.task("cypress-xray-plugin:add-evidence", {
 *     evidence: {
 *       data: Buffer.from("hello"),
 *       filename: "hello.txt"
 *     },
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
    evidence: Evidence
): Cypress.Chainable<Evidence>;

// Implementation.
export function enqueueTask(task: PluginTask, ...args: unknown[]): Cypress.Chainable<Evidence> {
    switch (task) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        case "cypress-xray-plugin:add-evidence": {
            return cy.task(task, {
                evidence: args[0],
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

    public addEvidence(args: { evidence: Evidence; test: string }): Evidence {
        try {
            const issueKeys = getTestIssueKeys(args.test, this.projectKey);
            for (const issueKey of issueKeys) {
                this.evidenceCollection.addEvidence(issueKey, {
                    ...args.evidence,
                    data: args.evidence.data.toString("base64"),
                });
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
