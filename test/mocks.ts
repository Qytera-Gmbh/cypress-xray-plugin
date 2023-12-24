import { AxiosRequestConfig } from "axios";
import chai from "chai";
import Sinon, { SinonStubbedInstance } from "sinon";
import sinonChai from "sinon-chai";
import { JWTCredentials } from "../src/authentication/credentials";
import { IJiraClient } from "../src/client/jira/jiraClient";
import { IXrayClient } from "../src/client/xray/xrayClient";
import { IXrayClientCloud } from "../src/client/xray/xrayClientCloud";
import { AxiosRestClient, REST } from "../src/https/requests";
import * as logging from "../src/logging/logging";
import { ILogger } from "../src/logging/logging";
import { IJiraFieldRepository } from "../src/repository/jira/fields/jiraFieldRepository";
import { IJiraIssueFetcher, SupportedFields } from "../src/repository/jira/fields/jiraIssueFetcher";
import { IJiraRepository } from "../src/repository/jira/jiraRepository";
import { ISearchRequest } from "../src/types/jira/requests/search";
import { IIssueUpdate } from "../src/types/jira/responses/issueUpdate";
import { IXrayTestExecutionResults } from "../src/types/xray/importTestExecutionResults";
import { CucumberMultipartFeature } from "../src/types/xray/requests/importExecutionCucumberMultipart";
import { ICucumberMultipartInfo } from "../src/types/xray/requests/importExecutionCucumberMultipartInfo";
import { dedent } from "../src/util/dedent";

chai.use(sinonChai);

beforeEach(() => {
    Sinon.restore();
});

export function getMockedLogger(
    stubbingOptions: { allowUnstubbedCalls?: boolean } = { allowUnstubbedCalls: false }
): SinonStubbedInstance<ILogger> {
    const logger = Sinon.stub(logging.LOG);
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
    const client = Sinon.stub(REST);
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

export function getMockedJiraClient(): SinonStubbedInstance<IJiraClient> {
    const client: IJiraClient = {
        addAttachment: function (issueIdOrKey: string, ...files: string[]) {
            throw mockCalledUnexpectedlyError(issueIdOrKey, files);
        },
        getIssueTypes: function () {
            throw mockCalledUnexpectedlyError();
        },
        getFields: function () {
            throw mockCalledUnexpectedlyError();
        },
        search: function (request: ISearchRequest) {
            throw mockCalledUnexpectedlyError(request);
        },
        editIssue: function (issueIdOrKey: string, issueUpdateData: IIssueUpdate) {
            throw mockCalledUnexpectedlyError(issueIdOrKey, issueUpdateData);
        },
    };
    return makeTransparent(Sinon.stub(client));
}

interface XrayClientMap {
    server: SinonStubbedInstance<IXrayClient>;
    cloud: SinonStubbedInstance<IXrayClientCloud>;
}
export function getMockedXrayClient<T extends keyof XrayClientMap>(kind?: T): XrayClientMap[T];
export function getMockedXrayClient<T extends keyof XrayClientMap>(
    kind?: T
): SinonStubbedInstance<IXrayClient> {
    if (kind !== "cloud") {
        const client: IXrayClient = {
            importExecution: function (execution: IXrayTestExecutionResults) {
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
                cucumberInfo: ICucumberMultipartInfo
            ) {
                throw mockCalledUnexpectedlyError(cucumberJson, cucumberInfo);
            },
        };
        return makeTransparent(Sinon.stub(client));
    }
    const client: IXrayClientCloud = {
        importExecution: function (execution: IXrayTestExecutionResults) {
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
            cucumberInfo: ICucumberMultipartInfo
        ) {
            throw mockCalledUnexpectedlyError(cucumberJson, cucumberInfo);
        },
        getTestTypes: function (projectKey: string, ...issueKeys: string[]) {
            throw mockCalledUnexpectedlyError(projectKey, issueKeys);
        },
    };
    return makeTransparent(Sinon.stub(client));
}

export function getMockedJiraFieldRepository(): SinonStubbedInstance<IJiraFieldRepository> {
    const fieldRepository: IJiraFieldRepository = {
        getFieldId: function (fieldName: SupportedFields) {
            throw mockCalledUnexpectedlyError(fieldName);
        },
    };
    return makeTransparent(Sinon.stub(fieldRepository));
}

export function getMockedJiraIssueFetcher(): SinonStubbedInstance<IJiraIssueFetcher> {
    const jiraIssueFetcher: IJiraIssueFetcher = {
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
    return makeTransparent(Sinon.stub(jiraIssueFetcher));
}

export function getMockedJiraRepository(): SinonStubbedInstance<IJiraRepository> {
    const jiraRepository: IJiraRepository = {
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
    return makeTransparent(Sinon.stub(jiraRepository));
}

export function getMockedJWTCredentials(): SinonStubbedInstance<JWTCredentials> {
    return makeTransparent(Sinon.stub(new JWTCredentials("abc", "xyz", "https://example.org")));
}

function mockCalledUnexpectedlyError(...args: unknown[]): Error {
    if (args.length > 0) {
        return new Error(
            dedent(`
                Mock called unexpectedly with args:
                  ${args.map((arg, index) => `arg ${index}: ${JSON.stringify(arg)}`).join("\n")};
            `)
        );
    }
    return new Error("Mock called unexpectedly");
}

/**
 * Forces stubs to call the real method unless overriden in tests.
 *
 * @param stub - the stub
 * @returns the transparent stub
 */
function makeTransparent<T>(stub: SinonStubbedInstance<T>): SinonStubbedInstance<T> {
    Object.values(stub).forEach((value: unknown) => {
        if (isStubbedFunction(value)) {
            value.callThrough();
        }
    });
    return stub;
}

/**
 * Checks whether a function is a stubbed function.
 *
 * @param f - the function
 * @returns `true` if the function is a stubbed function, `false` otherwise
 *
 * @see https://github.com/sinonjs/sinon/issues/532
 */
function isStubbedFunction<T extends unknown[], R>(f: unknown): f is Sinon.SinonStub<T, R> {
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
