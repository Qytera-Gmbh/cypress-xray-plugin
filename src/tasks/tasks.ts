import type { XrayEvidenceItem } from "../models/xray/import-test-execution-results";
import type { EvidenceCollection, IterationParameterCollection } from "../plugin/context";
import { encode } from "../util/base64";
import { dedent } from "../util/dedent";
import { errorMessage } from "../util/errors";
import { extractIssueKeys } from "../util/extraction";
import type { Logger } from "../util/logging";

type Task =
    | "cypress-xray-plugin:task:evidence:attachment"
    | "cypress-xray-plugin:task:iteration:definition"
    | "cypress-xray-plugin:task:request"
    | "cypress-xray-plugin:task:response";

/**
 * All tasks which are available within the plugin.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const PluginTask = {
    /**
     * The task that adds evidence to a test run.
     */
    ["EVIDENCE_ATTACHMENT"]: "cypress-xray-plugin:task:evidence:attachment",
    /**
     * The task which handles incoming responses from requests dispatched through `cy.request`
     * within a test.
     */
    ["INCOMING_RESPONSE"]: "cypress-xray-plugin:task:response",
    /**
     * The task that provides Xray iteration parameters for a test run. These can be used to
     * distinguish between iterations in the execution results view.
     */
    ["ITERATION_DEFINITION"]: "cypress-xray-plugin:task:iteration:definition",
    /**
     * The task which handles outgoing requests dispatched through `cy.request` within a test.
     */
    ["OUTGOING_REQUEST"]: "cypress-xray-plugin:task:request",
} as const;

/**
 * Enqueues the plugin task that adds Xray evidence to the current test run.
 *
 * @param task - the task name
 * @param evidence - the evidence to add to the current test run
 */
export function enqueueTask(
    task: "cypress-xray-plugin:task:evidence:attachment",
    evidence: Required<XrayEvidenceItem>
): Cypress.Chainable<XrayEvidenceItem>;
/**
 * Enqueues the plugin task for processing a dispatched request. The plugin internally keeps track
 * of all requests enqueued in this way and will upload them as test execution evidence if the
 * appropriate options are enabled.
 *
 * @deprecated Will be removed in version `9.0.0`. Please use the following instead:
 *
 * @example
 *
 * ```ts
 * Cypress.Commands.overwrite("request", (originalFn, request: Partial<Cypress.RequestOptions>) => {
 *   enqueueTask("cypress-xray-plugin:task:evidence:attachment", {
 *     contentType: "application/json",
 *     data: Buffer.from(JSON.stringify(request)).toString("base64"),
 *     filename: "my-request.json",
 *   });
 *   return originalFn(request);
 * });
 * ```
 *
 * @param task - the task name
 * @param filename - the name of the evidence file to save the request data to
 * @param request - the request data
 *
 * @see https://csvtuda.github.io/docs/cypress-xray-plugin/guides/uploadRequestData/
 */
export function enqueueTask(
    task: "cypress-xray-plugin:task:request",
    filename: string,
    request: Partial<Cypress.RequestOptions>
): Cypress.Chainable<Partial<Cypress.RequestOptions>>;
/**
 * Enqueues the plugin task for processing a received response. The plugin internally keeps track
 * of all responses enqueued in this way and will upload them as test execution evidence if the
 * appropriate options are enabled.
 *
 * @deprecated Will be removed in version `9.0.0`. Please use the following instead:
 *
 * @example
 *
 * ```ts
 * cy.request("my-url").then((response) =>
 *   enqueueTask("cypress-xray-plugin:task:evidence:attachment", {
 *     contentType: "application/json",
 *     data: Buffer.from(JSON.stringify(response)).toString("base64"),
 *     filename: "my-response.json",
 *   })
 * );
 * ```
 *
 * @param task - the task name
 * @param filename - the name of the evidence file to save the response data to
 * @param response - the response data
 *
 * @see https://csvtuda.github.io/docs/cypress-xray-plugin/guides/uploadRequestData/
 */
export function enqueueTask(
    task: "cypress-xray-plugin:task:response",
    filename: string,
    response: Cypress.Response<unknown>
): Cypress.Chainable<Cypress.Response<unknown>>;
/**
 * Enqueues the plugin task that defines the Xray iteration parameters for the current test run.
 *
 * @param task - the task name
 * @param parameters - the iteration parameters
 */
export function enqueueTask(
    task: "cypress-xray-plugin:task:iteration:definition",
    parameters: Record<string, string>
): Cypress.Chainable<Record<string, string>>;

// Implementation.
export function enqueueTask<T>(task: Task, ...args: unknown[]): Cypress.Chainable<T> {
    switch (task) {
        case "cypress-xray-plugin:task:evidence:attachment": {
            // Cast valid because of overload.
            const [evidence] = args as [Required<XrayEvidenceItem>];
            const taskParameters: PluginTaskParameterType["cypress-xray-plugin:task:evidence:attachment"] =
                { evidence: evidence, test: Cypress.currentTest.titlePath.join(" ") };
            return cy.task(task, taskParameters);
        }
        case "cypress-xray-plugin:task:request": {
            // Cast valid because of overload.
            const [filename, request] = args as [string, Partial<Cypress.RequestOptions>];
            const taskParameters: PluginTaskParameterType["cypress-xray-plugin:task:request"] = {
                filename: filename,
                request: request,
                test: Cypress.currentTest.titlePath.join(" "),
            };
            return cy.task(task, taskParameters);
        }
        case "cypress-xray-plugin:task:response": {
            // Cast valid because of overload.
            const [filename, response] = args as [string, Cypress.Response<unknown>];
            const taskParameters: PluginTaskParameterType["cypress-xray-plugin:task:response"] = {
                filename: filename,
                response: response,
                test: Cypress.currentTest.titlePath.join(" "),
            };
            return cy.task(task, taskParameters);
        }
        case "cypress-xray-plugin:task:iteration:definition": {
            // Cast valid because of overload.
            const [parameters] = args as [Record<string, string>];
            const taskParameters: PluginTaskParameterType["cypress-xray-plugin:task:iteration:definition"] =
                { parameters: parameters, test: Cypress.currentTest.titlePath.join(" ") };
            return cy.task(task, taskParameters);
        }
    }
}

/**
 * Models the parameters for the different plugin tasks.
 */
export interface PluginTaskParameterType {
    /**
     * The task parameters for attaching Xray evidence to test runs.
     */
    ["cypress-xray-plugin:task:evidence:attachment"]: {
        /**
         * The Xray evidence item to add to the current test.
         */
        evidence: Required<XrayEvidenceItem>;
        /**
         * The test name where the task was called.
         */
        test: string;
    };
    /**
     * The task parameters for defining Xray iteration data.
     */
    ["cypress-xray-plugin:task:iteration:definition"]: {
        /**
         * The Xray iteration parameters of the current test.
         */
        parameters: Record<string, string>;
        /**
         * The test name where the task was called.
         */
        test: string;
    };
    /**
     * The parameters for an outgoing request task.
     */
    ["cypress-xray-plugin:task:request"]: {
        /**
         * The filename of the file where the request data should be saved to.
         */
        filename: string;
        /**
         * The request data.
         */
        request: Partial<Cypress.RequestOptions>;
        /**
         * The test name where `cy.request` was called.
         */
        test: string;
    };
    /**
     * The parameters for an incoming response task.
     */
    ["cypress-xray-plugin:task:response"]: {
        /**
         * The filename of the file where the response data should be saved to.
         */
        filename: string;
        /**
         * The response data.
         */
        response: Cypress.Response<unknown>;
        /**
         * The test name where `cy.request` was called.
         */
        test: string;
    };
}

interface PluginTaskReturnType {
    /**
     * The result of an evidence attachment task.
     */
    ["cypress-xray-plugin:task:evidence:attachment"]: XrayEvidenceItem;
    /**
     * The result of an iteration parameter definition task.
     */
    ["cypress-xray-plugin:task:iteration:definition"]: Partial<Cypress.RequestOptions>;
    /**
     * The result of an outgoing request task.
     */
    ["cypress-xray-plugin:task:request"]: Partial<Cypress.RequestOptions>;
    /**
     * The result of an incoming response task.
     */
    ["cypress-xray-plugin:task:response"]: Cypress.Response<unknown>;
}

type TaskListener = {
    [K in Task]: (args: PluginTaskParameterType[K]) => PluginTaskReturnType[K];
};

export class CypressTaskListener implements TaskListener {
    private readonly projectKey: string;
    private readonly evidenceCollection: EvidenceCollection;
    private readonly iterationParameterCollection: IterationParameterCollection;
    private readonly logger: Pick<Logger, "message">;
    private readonly ignoredTests = new Set<string>();

    constructor(
        projectKey: string,
        evidenceCollection: EvidenceCollection,
        iterationParameterCollection: IterationParameterCollection,
        logger: Pick<Logger, "message">
    ) {
        this.projectKey = projectKey;
        this.evidenceCollection = evidenceCollection;
        this.iterationParameterCollection = iterationParameterCollection;
        this.logger = logger;
    }

    public ["cypress-xray-plugin:task:evidence:attachment"](
        args: PluginTaskParameterType["cypress-xray-plugin:task:evidence:attachment"]
    ) {
        for (const key of this.getKeys(args.test, "cypress-xray-plugin:task:evidence:attachment")) {
            this.evidenceCollection.addEvidence(key, args.evidence);
        }
        return args.evidence;
    }

    public ["cypress-xray-plugin:task:request"](
        args: PluginTaskParameterType["cypress-xray-plugin:task:request"]
    ) {
        for (const key of this.getKeys(args.test, "cypress-xray-plugin:task:request")) {
            this.evidenceCollection.addEvidence(key, {
                contentType: "application/json",
                data: encode(JSON.stringify(args.request, null, 2)),
                filename: args.filename,
            });
        }
        return args.request;
    }

    public ["cypress-xray-plugin:task:response"](
        args: PluginTaskParameterType["cypress-xray-plugin:task:response"]
    ) {
        for (const key of this.getKeys(args.test, "cypress-xray-plugin:task:response")) {
            this.evidenceCollection.addEvidence(key, {
                contentType: "application/json",
                data: encode(JSON.stringify(args.response, null, 2)),
                filename: args.filename,
            });
        }
        return args.response;
    }

    public ["cypress-xray-plugin:task:iteration:definition"](
        args: PluginTaskParameterType["cypress-xray-plugin:task:iteration:definition"]
    ) {
        for (const key of this.getKeys(
            args.test,
            "cypress-xray-plugin:task:iteration:definition"
        )) {
            this.iterationParameterCollection.setIterationParameters(
                key,
                args.test,
                args.parameters
            );
        }
        return args.parameters;
    }

    private getKeys(test: string, task: Task): string[] {
        try {
            return extractIssueKeys(test, this.projectKey);
        } catch (error: unknown) {
            if (!this.ignoredTests.has(test)) {
                this.logger.message(
                    "warning",
                    dedent(`
                        Test: ${test}

                          Encountered a ${task} task call which cannot be mapped to a test.

                            Caused by: ${errorMessage(error)}
                    `)
                );
                this.ignoredTests.add(test);
            }
            return [];
        }
    }
}
