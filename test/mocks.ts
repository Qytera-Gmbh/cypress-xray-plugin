import { AxiosRequestConfig } from "axios";
import chai from "chai";
import { SinonStub, SinonStubbedInstance, restore, stub } from "sinon";
import sinonChai from "sinon-chai";
import { JwtCredentials } from "../src/authentication/credentials";
import { JiraClient } from "../src/client/jira/jiraClient";
import { XrayClient } from "../src/client/xray/xrayClient";
import { HasTestTypes, XrayClientCloud } from "../src/client/xray/xrayClientCloud";
import { AxiosRestClient } from "../src/https/requests";
import * as logging from "../src/logging/logging";
import { Logger } from "../src/logging/logging";
import { JiraFieldRepository } from "../src/repository/jira/fields/jiraFieldRepository";
import { JiraIssueFetcher, SupportedFields } from "../src/repository/jira/fields/jiraIssueFetcher";
import { JiraRepository } from "../src/repository/jira/jiraRepository";
import { SearchRequest } from "../src/types/jira/requests/search";
import { IssueUpdate } from "../src/types/jira/responses/issueUpdate";
import { XrayTestExecutionResults } from "../src/types/xray/importTestExecutionResults";
import { CucumberMultipartFeature } from "../src/types/xray/requests/importExecutionCucumberMultipart";
import { CucumberMultipartInfo } from "../src/types/xray/requests/importExecutionCucumberMultipartInfo";
import { dedent } from "../src/util/dedent";

chai.use(sinonChai);

beforeEach(() => {
    restore();
});

export function getMockedLogger(
    stubbingOptions: { allowUnstubbedCalls?: boolean } = { allowUnstubbedCalls: false }
): SinonStubbedInstance<Logger> {
    const logger = stub(logging.LOG);
    if (!stubbingOptions.allowUnstubbedCalls) {
        logger.configure.callsFake((options: logging.LoggingOptions) => {
            throw mockCalledUnexpectedlyError(options);
        });
        logger.logErrorToFile.callsFake((error: unknown, filename: string) => {
            throw mockCalledUnexpectedlyError(error, filename);
        });
        logger.logToFile.callsFake((data: unknown, filename: string) => {
            throw mockCalledUnexpectedlyError(data, filename);
        });
        logger.message.callsFake((level: logging.Level, ...text: string[]) => {
            throw mockCalledUnexpectedlyError(level, text);
        });
    }
    return logger;
}

export function getMockedRestClient(): SinonStubbedInstance<AxiosRestClient> {
    const client = stub(new AxiosRestClient({}));
    client.get.callsFake((url: string, config?: AxiosRequestConfig<unknown>) => {
        throw mockCalledUnexpectedlyError(url, config);
    });
    client.post.callsFake((url: string, data?: unknown, config?: AxiosRequestConfig<unknown>) => {
        throw mockCalledUnexpectedlyError(url, data, config);
    });
    client.put.callsFake((url: string, data?: unknown, config?: AxiosRequestConfig<unknown>) => {
        throw mockCalledUnexpectedlyError(url, data, config);
    });
    return client;
}

export function getMockedJiraClient(): SinonStubbedInstance<JiraClient> {
    const client: JiraClient = {
        addAttachment: function (issueIdOrKey: string, ...files: string[]) {
            throw mockCalledUnexpectedlyError(issueIdOrKey, files);
        },
        getIssueTypes: function () {
            throw mockCalledUnexpectedlyError();
        },
        getFields: function () {
            throw mockCalledUnexpectedlyError();
        },
        search: function (request: SearchRequest) {
            throw mockCalledUnexpectedlyError(request);
        },
        editIssue: function (issueIdOrKey: string, issueUpdateData: IssueUpdate) {
            throw mockCalledUnexpectedlyError(issueIdOrKey, issueUpdateData);
        },
    };
    return makeTransparent(stub(client));
}

interface XrayClientMap {
    server: SinonStubbedInstance<XrayClient>;
    cloud: SinonStubbedInstance<XrayClientCloud>;
}
export function getMockedXrayClient<T extends keyof XrayClientMap>(kind?: T): XrayClientMap[T];
export function getMockedXrayClient<T extends keyof XrayClientMap>(
    kind?: T
): SinonStubbedInstance<XrayClient> {
    if (kind !== "cloud") {
        const client: XrayClient = {
            importExecution: function (execution: XrayTestExecutionResults) {
                throw mockCalledUnexpectedlyError(execution);
            },
            exportCucumber: function (keys?: string[], filter?: number) {
                throw mockCalledUnexpectedlyError(keys, filter);
            },
            importFeature: function (
                file: string,
                projectKey?: string,
                projectId?: string,
                source?: string
            ) {
                throw mockCalledUnexpectedlyError(file, projectKey, projectId, source);
            },
            importExecutionCucumberMultipart: function (
                cucumberJson: CucumberMultipartFeature[],
                cucumberInfo: CucumberMultipartInfo
            ) {
                throw mockCalledUnexpectedlyError(cucumberJson, cucumberInfo);
            },
        };
        return makeTransparent(stub(client));
    }
    const client: XrayClient & HasTestTypes = {
        importExecution: function (execution: XrayTestExecutionResults) {
            throw mockCalledUnexpectedlyError(execution);
        },
        exportCucumber: function (keys?: string[], filter?: number) {
            throw mockCalledUnexpectedlyError(keys, filter);
        },
        importFeature: function (
            file: string,
            projectKey?: string,
            projectId?: string,
            source?: string
        ) {
            throw mockCalledUnexpectedlyError(file, projectKey, projectId, source);
        },
        importExecutionCucumberMultipart: function (
            cucumberJson: CucumberMultipartFeature[],
            cucumberInfo: CucumberMultipartInfo
        ) {
            throw mockCalledUnexpectedlyError(cucumberJson, cucumberInfo);
        },
        getTestTypes: function (projectKey: string, ...issueKeys: string[]) {
            throw mockCalledUnexpectedlyError(projectKey, issueKeys);
        },
    };
    return makeTransparent(stub(client));
}

export function getMockedJiraFieldRepository(): SinonStubbedInstance<JiraFieldRepository> {
    const fieldRepository: JiraFieldRepository = {
        getFieldId: function (fieldName: SupportedFields) {
            throw mockCalledUnexpectedlyError(fieldName);
        },
    };
    return makeTransparent(stub(fieldRepository));
}

export function getMockedJiraIssueFetcher(): SinonStubbedInstance<JiraIssueFetcher> {
    const jiraIssueFetcher: JiraIssueFetcher = {
        fetchDescriptions: function (...issueKeys: string[]) {
            throw mockCalledUnexpectedlyError(issueKeys);
        },
        fetchLabels: function (...issueKeys: string[]) {
            throw mockCalledUnexpectedlyError(issueKeys);
        },
        fetchSummaries: function (...issueKeys: string[]) {
            throw mockCalledUnexpectedlyError(issueKeys);
        },
        fetchTestTypes: function (...issueKeys: string[]) {
            throw mockCalledUnexpectedlyError(issueKeys);
        },
    };
    return makeTransparent(stub(jiraIssueFetcher));
}

export function getMockedJiraRepository(): SinonStubbedInstance<JiraRepository> {
    const jiraRepository: JiraRepository = {
        getFieldId: function (fieldName: SupportedFields) {
            throw mockCalledUnexpectedlyError(fieldName);
        },
        getDescriptions: function (...issueKeys: string[]) {
            throw mockCalledUnexpectedlyError(issueKeys);
        },
        getLabels: function (...issueKeys: string[]) {
            throw mockCalledUnexpectedlyError(issueKeys);
        },
        getSummaries: function (...issueKeys: string[]) {
            throw mockCalledUnexpectedlyError(issueKeys);
        },
        getTestTypes: function (...issueKeys: string[]) {
            throw mockCalledUnexpectedlyError(issueKeys);
        },
    };
    return makeTransparent(stub(jiraRepository));
}

export function getMockedJwtCredentials(): SinonStubbedInstance<JwtCredentials> {
    return makeTransparent(
        stub(new JwtCredentials("abc", "xyz", "https://example.org", getMockedRestClient()))
    );
}

export function getMockedCypress(): {
    cypress: Cypress.Cypress & CyEventEmitter;
    cy: Cypress.cy & CyEventEmitter;
} {
    global.Cypress = {
        currentTest: {
            title: "MOCK TITLE",
            titlePath: ["MOCK PATH"],
        },
    } as Cypress.Cypress & CyEventEmitter;
    global.cy = {
        task: () => {
            throw new Error("Mock called unexpectedly");
        },
    } as unknown as Cypress.cy & CyEventEmitter;
    return { cypress: global.Cypress, cy: global.cy };
}

function mockCalledUnexpectedlyError(...args: unknown[]): Error {
    if (args.length > 0) {
        return new Error(
            dedent(`
                Mock called unexpectedly with args:
                  ${args
                      .map((arg, index) => `arg ${index.toString()}: ${JSON.stringify(arg)}`)
                      .join("\n")};
            `)
        );
    }
    return new Error("Mock called unexpectedly");
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
