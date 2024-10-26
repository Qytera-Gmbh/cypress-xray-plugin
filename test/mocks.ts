import { AxiosRequestConfig } from "axios";
import chai from "chai";
import { SinonStub, SinonStubbedInstance, restore, stub } from "sinon";
import sinonChai from "sinon-chai";
import { JwtCredentials } from "../src/client/authentication/credentials";
import { AxiosRestClient } from "../src/client/https/requests";
import { JiraClient } from "../src/client/jira/jira-client";
import { XrayClient } from "../src/client/xray/xray-client";
import {
    HasTestResults,
    HasTestTypes,
    XrayClientCloud,
} from "../src/client/xray/xray-client-cloud";
import { SearchRequest } from "../src/types/jira/requests/search";
import { IssueUpdate } from "../src/types/jira/responses/issue-update";
import { User } from "../src/types/jira/responses/user";
import { XrayTestExecutionResults } from "../src/types/xray/import-test-execution-results";
import { CucumberMultipartFeature } from "../src/types/xray/requests/import-execution-cucumber-multipart";
import { MultipartInfo } from "../src/types/xray/requests/import-execution-multipart-info";
import { dedent } from "../src/util/dedent";
import * as logging from "../src/util/logging";
import { Logger } from "../src/util/logging";

chai.use(sinonChai);

beforeEach(() => {
    restore();
});

export function getMockedLogger(
    stubbingOptions: { allowUnstubbedCalls?: boolean } = { allowUnstubbedCalls: true }
): SinonStubbedInstance<Logger> {
    const logger = stub(logging.LOG);
    if (!stubbingOptions.allowUnstubbedCalls) {
        logger.configure.callsFake((options: logging.LoggingOptions) => {
            throw mockCalledUnexpectedlyError("configure", options);
        });
        logger.logErrorToFile.callsFake((error: unknown, filename: string) => {
            throw mockCalledUnexpectedlyError("logErrorToFile", error, filename);
        });
        logger.logToFile.callsFake((data: unknown, filename: string) => {
            throw mockCalledUnexpectedlyError("logToFile", data, filename);
        });
        logger.message.callsFake((level: logging.Level, ...text: string[]) => {
            throw mockCalledUnexpectedlyError("message", level, text);
        });
    }
    return logger;
}

export function getMockedRestClient(): SinonStubbedInstance<AxiosRestClient> {
    const client = stub(new AxiosRestClient({}));
    client.get.callsFake((url: string, config?: AxiosRequestConfig<unknown>) => {
        throw mockCalledUnexpectedlyError("get", url, config);
    });
    client.post.callsFake((url: string, data?: unknown, config?: AxiosRequestConfig<unknown>) => {
        throw mockCalledUnexpectedlyError("post", url, data, config);
    });
    client.put.callsFake((url: string, data?: unknown, config?: AxiosRequestConfig<unknown>) => {
        throw mockCalledUnexpectedlyError("put", url, data, config);
    });
    return client;
}

export function getMockedJiraClient(): SinonStubbedInstance<JiraClient> {
    const client: JiraClient = {
        addAttachment: function (issueIdOrKey: string, ...files: string[]) {
            throw mockCalledUnexpectedlyError("addAttachment", issueIdOrKey, files);
        },
        editIssue: function (issueIdOrKey: string, issueUpdateData: IssueUpdate) {
            throw mockCalledUnexpectedlyError("editIssue", issueIdOrKey, issueUpdateData);
        },
        getFields: function () {
            throw mockCalledUnexpectedlyError("getFields");
        },
        getIssueTypes: function () {
            throw mockCalledUnexpectedlyError("getIssueTypes");
        },
        getMyself: function (): Promise<User> {
            throw mockCalledUnexpectedlyError("getMyself");
        },
        search: function (request: SearchRequest) {
            throw mockCalledUnexpectedlyError("search", request);
        },
        transitionIssue: function (issueIdOrKey: string, issueUpdateData: IssueUpdate) {
            throw mockCalledUnexpectedlyError("transitionIssue", issueIdOrKey, issueUpdateData);
        },
    };
    return makeTransparent(stub(client));
}

interface XrayClientMap {
    cloud: SinonStubbedInstance<XrayClientCloud>;
    server: SinonStubbedInstance<XrayClient>;
}
export function getMockedXrayClient<T extends keyof XrayClientMap>(kind?: T): XrayClientMap[T];
export function getMockedXrayClient<T extends keyof XrayClientMap>(
    kind?: T
): SinonStubbedInstance<XrayClient> {
    if (kind !== "cloud") {
        const client: XrayClient = {
            importExecution: function (execution: XrayTestExecutionResults) {
                throw mockCalledUnexpectedlyError("importExecution", execution);
            },
            importExecutionCucumberMultipart: function (
                cucumberJson: CucumberMultipartFeature[],
                cucumberInfo: MultipartInfo
            ) {
                throw mockCalledUnexpectedlyError(
                    "importExecutionCucumberMultipart",
                    cucumberJson,
                    cucumberInfo
                );
            },
            importExecutionMultipart: function (
                executionResults: XrayTestExecutionResults,
                info: MultipartInfo
            ) {
                throw mockCalledUnexpectedlyError(
                    "importExecutionMultipart",
                    executionResults,
                    info
                );
            },
            importFeature: function (
                file: string,
                query: {
                    projectId?: string;
                    projectKey?: string;
                    source?: string;
                }
            ) {
                throw mockCalledUnexpectedlyError(
                    "importFeature",
                    file,
                    query.projectKey,
                    query.projectId,
                    query.source
                );
            },
        };
        return makeTransparent(stub(client));
    }
    const client: XrayClient & HasTestTypes & HasTestResults = {
        getTestResults(issueId: string) {
            throw mockCalledUnexpectedlyError("getTestResults", issueId);
        },
        getTestTypes: function (projectKey: string, ...issueKeys: string[]) {
            throw mockCalledUnexpectedlyError("getTestTypes", projectKey, issueKeys);
        },
        importExecution: function (execution: XrayTestExecutionResults) {
            throw mockCalledUnexpectedlyError("importExecution", execution);
        },
        importExecutionCucumberMultipart: function (
            cucumberJson: CucumberMultipartFeature[],
            cucumberInfo: MultipartInfo
        ) {
            throw mockCalledUnexpectedlyError(
                "importExecutionCucumberMultipart",
                cucumberJson,
                cucumberInfo
            );
        },
        importExecutionMultipart: function (
            executionResults: XrayTestExecutionResults,
            info: MultipartInfo
        ) {
            throw mockCalledUnexpectedlyError("importExecutionMultipart", executionResults, info);
        },
        importFeature: function (
            file: string,
            query: {
                projectId?: string;
                projectKey?: string;
                source?: string;
            }
        ) {
            throw mockCalledUnexpectedlyError(
                "importFeature",
                file,
                query.projectKey,
                query.projectId,
                query.source
            );
        },
    };
    return makeTransparent(stub(client));
}

export function getMockedJwtCredentials(): SinonStubbedInstance<JwtCredentials> {
    return makeTransparent(
        stub(new JwtCredentials("abc", "xyz", "https://example.org", getMockedRestClient()))
    );
}

export function getMockedCypress(): {
    cy: Cypress.cy & CyEventEmitter;
    cypress: Cypress.Cypress & CyEventEmitter;
} {
    global.Cypress = {
        ["Commands"]: {},
        currentTest: {},
    } as Cypress.Cypress & CyEventEmitter;
    global.cy = {
        task: () => {
            throw new Error("Mock called unexpectedly");
        },
    } as unknown as Cypress.cy & CyEventEmitter;
    return { cy: global.cy, cypress: global.Cypress };
}

function mockCalledUnexpectedlyError(functionName: string, ...args: unknown[]): Error {
    if (args.length > 0) {
        return new Error(
            dedent(`
                Mocked ${functionName} called unexpectedly with args:
                  ${args
                      .map((arg, index) => `arg ${index.toString()}: ${JSON.stringify(arg)}`)
                      .join("\n")};
            `)
        );
    }
    return new Error(`Mocked ${functionName} called unexpectedly`);
}

/**
 * Forces stubs to call the real method unless overriden in tests.
 *
 * @param stubbedFunction - the stub
 * @returns the transparent stub
 */
function makeTransparent<T>(stubbedFunction: SinonStubbedInstance<T>): SinonStubbedInstance<T> {
    Object.values(stubbedFunction).forEach((value: unknown) => {
        if (isStubbedFunction(value)) {
            value.callThrough();
        }
    });
    return stubbedFunction;
}

/**
 * Checks whether a function is a stubbed function.
 *
 * @param f - the function
 * @returns `true` if the function is a stubbed function, `false` otherwise
 *
 * @see https://github.com/sinonjs/sinon/issues/532
 */
function isStubbedFunction<T extends unknown[], R>(f: unknown): f is SinonStub<T, R> {
    if (f === null || typeof f !== "function" || !("restore" in f)) {
        return false;
    }
    const wrappedMethod = f.restore;
    if (
        wrappedMethod === null ||
        typeof wrappedMethod !== "function" ||
        !("sinon" in wrappedMethod)
    ) {
        return false;
    }
    return wrappedMethod.sinon === true;
}
