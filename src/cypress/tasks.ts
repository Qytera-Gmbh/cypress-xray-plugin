import { EvidenceCollection } from "../context";
import { getNativeTestIssueKey } from "../hooks/after/util";
import { encode } from "../util/base64";
import { dedent } from "../util/dedent";
import { errorMessage } from "../util/errors";
import { LOG, Level } from "../util/logging";

/**
 * All tasks which are available within the plugin.
 */
export enum PluginTask {
    /**
     * The task which handles outgoing requests dispatched through `cy.request` within a test.
     */
    OUTGOING_REQUEST = "cypress-xray-plugin:task:request",
    /**
     * The task which handles incoming responses from requests dispatched through `cy.request`
     * within a test.
     */
    INCOMING_RESPONSE = "cypress-xray-plugin:task:response",
}

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
    task: PluginTask.OUTGOING_REQUEST,
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
    task: PluginTask.INCOMING_RESPONSE,
    filename: string,
    response: Cypress.Response<unknown>
): Cypress.Chainable<Cypress.Response<unknown>>;
export function enqueueTask<T>(
    task: PluginTask,
    filename: string,
    arg: unknown
): Cypress.Chainable<T> {
    switch (task) {
        case PluginTask.OUTGOING_REQUEST: {
            const parameters: PluginTaskParameterType[PluginTask.OUTGOING_REQUEST] = {
                test: Cypress.currentTest.title,
                filename: filename,
                request: arg as Partial<Cypress.RequestOptions>,
            };
            return cy.task(task, parameters);
        }
        case PluginTask.INCOMING_RESPONSE: {
            const parameters: PluginTaskParameterType[PluginTask.INCOMING_RESPONSE] = {
                test: Cypress.currentTest.title,
                filename: filename,
                response: arg as Cypress.Response<unknown>,
            };
            return cy.task(task, parameters);
        }
    }
}

/**
 * Models the parameters for the different plugin tasks.
 */
export interface PluginTaskParameterType {
    /**
     * The parameters for an outgoing request task.
     */
    [PluginTask.OUTGOING_REQUEST]: {
        /**
         * The test name where `cy.request` was called.
         */
        test: string;
        /**
         * The filename of the file where the request data should be saved to.
         */
        filename: string;
        /**
         * The request data.
         */
        request: Partial<Cypress.RequestOptions>;
    };
    /**
     * The parameters for an incoming response task.
     */
    [PluginTask.INCOMING_RESPONSE]: {
        /**
         * The test name where `cy.request` was called.
         */
        test: string;
        /**
         * The filename of the file where the response data should be saved to.
         */
        filename: string;
        /**
         * The response data.
         */
        response: Cypress.Response<unknown>;
    };
}

interface PluginTaskReturnType {
    /**
     * The result of an outgoing request task.
     */
    [PluginTask.OUTGOING_REQUEST]: Partial<Cypress.RequestOptions>;
    /**
     * The result of an incoming response task.
     */
    [PluginTask.INCOMING_RESPONSE]: Cypress.Response<unknown>;
}

type TaskListener = {
    [K in PluginTask]: (args: PluginTaskParameterType[K]) => PluginTaskReturnType[K];
};

export class PluginTaskListener implements TaskListener {
    private readonly projectKey: string;
    private readonly evidenceCollection: EvidenceCollection;
    private readonly ignoredTests = new Set<string>();

    constructor(projectKey: string, evidenceCollection: EvidenceCollection) {
        this.projectKey = projectKey;
        this.evidenceCollection = evidenceCollection;
    }

    public [PluginTask.OUTGOING_REQUEST](
        args: PluginTaskParameterType[PluginTask.OUTGOING_REQUEST]
    ) {
        try {
            const issueKey = getNativeTestIssueKey(args.test, this.projectKey);
            this.evidenceCollection.addEvidence(issueKey, {
                filename: args.filename,
                contentType: "application/json",
                data: encode(JSON.stringify(args.request, null, 2)),
            });
        } catch (error: unknown) {
            if (!this.ignoredTests.has(args.test)) {
                LOG.message(
                    Level.WARNING,
                    dedent(`
                        Encountered a cy.request call which will not be included as evidence for test: ${
                            args.test
                        }

                        ${errorMessage(error)}
                    `)
                );
                this.ignoredTests.add(args.test);
            }
        }
        return args.request;
    }

    public [PluginTask.INCOMING_RESPONSE](
        args: PluginTaskParameterType[PluginTask.INCOMING_RESPONSE]
    ) {
        try {
            const issueKey = getNativeTestIssueKey(args.test, this.projectKey);
            this.evidenceCollection.addEvidence(issueKey, {
                filename: args.filename,
                contentType: "application/json",
                data: encode(JSON.stringify(args.response, null, 2)),
            });
        } catch (error: unknown) {
            if (!this.ignoredTests.has(args.test)) {
                LOG.message(
                    Level.WARNING,
                    dedent(`
                        Encountered a cy.request call which will not be included as evidence for test: ${
                            args.test
                        }

                        ${errorMessage(error)}
                    `)
                );
                this.ignoredTests.add(args.test);
            }
        }
        return args.response;
    }
}
