import type { EvidenceCollection, IterationParameterCollection } from "../context";
import { getTestIssueKeys } from "../hooks/after/util";
import { encode } from "../util/base64";
import { dedent } from "../util/dedent";
import { errorMessage } from "../util/errors";
import type { Logger } from "../util/logging";

type Task =
    | "cypress-xray-plugin:task:iteration:definition"
    | "cypress-xray-plugin:task:request"
    | "cypress-xray-plugin:task:response";

/**
 * All tasks which are available within the plugin.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const PluginTask = {
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
 * Enqueues the plugin task for processing a dispatched request. The plugin internally keeps track
 * of all requests enqueued in this way and will upload them as test execution evidence if the
 * appropriate options are enabled.
 *
 * @param task - the task name
 * @param filename - the name of the evidence file to save the request data to
 * @param request - the request data
 *
 * @see https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/uploadRequestData/
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
 * @param task - the task name
 * @param filename - the name of the evidence file to save the response data to
 * @param response - the response data
 *
 * @see https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/uploadRequestData/
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
export function enqueueTask<T>(task: Task, ...args: unknown[]): Cypress.Chainable<T> {
    switch (task) {
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
                {
                    parameters: parameters,
                    test: Cypress.currentTest.titlePath.join(" "),
                };
            return cy.task(task, taskParameters);
        }
    }
}

/**
 * Models the parameters for the different plugin tasks.
 */
export interface PluginTaskParameterType {
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
     * The result of an itereation parameter definition task task.
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
    private readonly logger: Logger;
    private readonly ignoredTests = new Set<string>();

    constructor(
        projectKey: string,
        evidenceCollection: EvidenceCollection,
        iterationParameterCollection: IterationParameterCollection,
        logger: Logger
    ) {
        this.projectKey = projectKey;
        this.evidenceCollection = evidenceCollection;
        this.iterationParameterCollection = iterationParameterCollection;
        this.logger = logger;
    }

    public ["cypress-xray-plugin:task:request"](
        args: PluginTaskParameterType["cypress-xray-plugin:task:request"]
    ) {
        try {
            const issueKeys = getTestIssueKeys(args.test, this.projectKey);
            for (const issueKey of issueKeys) {
                this.evidenceCollection.addEvidence(issueKey, {
                    contentType: "application/json",
                    data: encode(JSON.stringify(args.request, null, 2)),
                    filename: args.filename,
                });
            }
        } catch (error: unknown) {
            if (!this.ignoredTests.has(args.test)) {
                this.logger.message(
                    "warning",
                    dedent(`
                        Test: ${args.test}

                          Encountered a cy.request call which will not be included as evidence.

                            Caused by: ${errorMessage(error)}
                    `)
                );
                this.ignoredTests.add(args.test);
            }
        }
        return args.request;
    }

    public ["cypress-xray-plugin:task:response"](
        args: PluginTaskParameterType["cypress-xray-plugin:task:response"]
    ) {
        try {
            const issueKeys = getTestIssueKeys(args.test, this.projectKey);
            for (const issueKey of issueKeys) {
                this.evidenceCollection.addEvidence(issueKey, {
                    contentType: "application/json",
                    data: encode(JSON.stringify(args.response, null, 2)),
                    filename: args.filename,
                });
            }
        } catch (error: unknown) {
            if (!this.ignoredTests.has(args.test)) {
                this.logger.message(
                    "warning",
                    dedent(`
                        Test: ${args.test}

                          Encountered a cy.request call which will not be included as evidence.

                            Caused by: ${errorMessage(error)}
                    `)
                );
                this.ignoredTests.add(args.test);
            }
        }
        return args.response;
    }

    public ["cypress-xray-plugin:task:iteration:definition"](
        args: PluginTaskParameterType["cypress-xray-plugin:task:iteration:definition"]
    ) {
        try {
            const issueKeys = getTestIssueKeys(args.test, this.projectKey);
            for (const issueKey of issueKeys) {
                this.iterationParameterCollection.setIterationParameters(
                    issueKey,
                    args.test,
                    args.parameters
                );
            }
        } catch (error: unknown) {
            if (!this.ignoredTests.has(args.test)) {
                this.logger.message(
                    "warning",
                    dedent(`
                        Test: ${args.test}

                          Encountered an iteration definition task call which cannot be mapped to a test.

                            Caused by: ${errorMessage(error)}
                    `)
                );
                this.ignoredTests.add(args.test);
            }
        }
        return args.parameters;
    }
}
