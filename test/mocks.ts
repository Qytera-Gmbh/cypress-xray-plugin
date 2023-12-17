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
import { initLogging } from "../src/logging/logging";
import { IJiraFieldRepository } from "../src/repository/jira/fields/jiraFieldRepository";
import { IJiraIssueFetcher, SupportedFields } from "../src/repository/jira/fields/jiraIssueFetcher";
import { IJiraRepository } from "../src/repository/jira/jiraRepository";
import { ISearchRequest } from "../src/types/jira/requests/search";
import { IIssueUpdate } from "../src/types/jira/responses/issueUpdate";
import { IXrayTestExecutionResults } from "../src/types/xray/importTestExecutionResults";
import { CucumberMultipartFeature } from "../src/types/xray/requests/importExecutionCucumberMultipart";
import { ICucumberMultipartInfo } from "../src/types/xray/requests/importExecutionCucumberMultipartInfo";
import { dedent } from "../src/util/dedent";
import { TEST_TMP_DIR } from "./util";

chai.use(sinonChai);

before(() => {
    stubLogging("initLogging");
});

beforeEach(() => {
    Sinon.restore();
    initLogging({ logDirectory: TEST_TMP_DIR });
});

/**
 * Stubs the logging module members. An optional list of spies can be provided, which will result
 * in the corresponding members being spied on instead of stubbing them completely.
 *
 * @param spies - the array of members to spy on only
 * @returns an object containing the logging module's stubs or spies
 */
export const stubLogging = (...spies: (keyof typeof logging)[]) => {
    return {
        stubbedInit: spies.includes("initLogging")
            ? Sinon.spy(logging, "initLogging")
            : Sinon.stub(logging, "initLogging"),
        stubbedWrite: spies.includes("writeFile")
            ? Sinon.spy(logging, "writeFile")
            : Sinon.stub(logging, "writeFile"),
        stubbedWriteErrorFile: spies.includes("writeErrorFile")
            ? Sinon.spy(logging, "writeErrorFile")
            : Sinon.stub(logging, "writeErrorFile"),
        stubbedInfo: spies.includes("logInfo")
            ? Sinon.spy(logging, "logInfo")
            : Sinon.stub(logging, "logInfo"),
        stubbedError: spies.includes("logError")
            ? Sinon.spy(logging, "logError")
            : Sinon.stub(logging, "logError"),
        stubbedSuccess: spies.includes("logSuccess")
            ? Sinon.spy(logging, "logSuccess")
            : Sinon.stub(logging, "logSuccess"),
        stubbedWarning: spies.includes("logWarning")
            ? Sinon.spy(logging, "logWarning")
            : Sinon.stub(logging, "logWarning"),
        stubbedDebug: spies.includes("logDebug")
            ? Sinon.spy(logging, "logDebug")
            : Sinon.stub(logging, "logDebug"),
    };
};

export function getMockedRestClient(): SinonStubbedInstance<AxiosRestClient> {
    const client = Sinon.stub(REST);
    client.get.callsFake((url: string, config?: AxiosRequestConfig<undefined>) => {
        throw new Error(
            dedent(`
                Mock called unexpectedly with args:
                  arg 1: ${JSON.stringify(url)}
                  arg 2: ${JSON.stringify(config)}
            `)
        );
    });
    client.post.callsFake((url: string, data?: unknown, config?: AxiosRequestConfig<unknown>) => {
        throw new Error(
            dedent(`
                Mock called unexpectedly with args:
                  arg 1: ${JSON.stringify(url)}
                  arg 2: ${JSON.stringify(data)}
                  arg 3: ${JSON.stringify(config)}
            `)
        );
    });
    client.put.callsFake((url: string, data?: unknown, config?: AxiosRequestConfig<unknown>) => {
        throw new Error(
            dedent(`
                Mock called unexpectedly with args:
                  arg 1: ${JSON.stringify(url)}
                  arg 2: ${JSON.stringify(data)}
                  arg 3: ${JSON.stringify(config)}
            `)
        );
    });
    return client;
}

export function getMockedJiraClient(): SinonStubbedInstance<IJiraClient> {
    const client: IJiraClient = {
        addAttachment: function (issueIdOrKey: string, ...files: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(issueIdOrKey)}
                      arg 2: ${JSON.stringify(files)}
                `)
            );
        },
        getIssueTypes: function () {
            throw new Error("Mock called unexpectedly");
        },
        getFields: function () {
            throw new Error("Mock called unexpectedly");
        },
        search: function (request: ISearchRequest) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(request)}
                `)
            );
        },
        editIssue: function (issueIdOrKey: string, issueUpdateData: IIssueUpdate) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(issueIdOrKey)}
                      arg 2: ${JSON.stringify(issueUpdateData)}
                `)
            );
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
                throw new Error(
                    dedent(`
                        Mock called unexpectedly with args:
                          arg 1: ${JSON.stringify(execution)}
                    `)
                );
            },
            exportCucumber: function (keys?: string[], filter?: number) {
                throw new Error(
                    dedent(`
                        Mock called unexpectedly with args:
                          arg 1: ${JSON.stringify(keys)}
                          arg 2: ${JSON.stringify(filter)}
                    `)
                );
            },
            importFeature: function (
                file: string,
                projectKey?: string,
                projectId?: string,
                source?: string
            ) {
                throw new Error(
                    dedent(`
                        Mock called unexpectedly with args:
                          arg 1: ${JSON.stringify(file)}
                          arg 2: ${JSON.stringify(projectKey)}
                          arg 3: ${JSON.stringify(projectId)}
                          arg 4: ${JSON.stringify(source)}
                    `)
                );
            },
            importExecutionCucumberMultipart: function (
                cucumberJson: CucumberMultipartFeature[],
                cucumberInfo: ICucumberMultipartInfo
            ) {
                throw new Error(
                    dedent(`
                        Mock called unexpectedly with args:
                          arg 1: ${JSON.stringify(cucumberJson)}
                          arg 2: ${JSON.stringify(cucumberInfo)}
                    `)
                );
            },
        };
        return makeTransparent(Sinon.stub(client));
    }
    const client: IXrayClientCloud = {
        importExecution: function (execution: IXrayTestExecutionResults) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(execution)}
                `)
            );
        },
        exportCucumber: function (keys?: string[], filter?: number) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(keys)}
                      arg 2: ${JSON.stringify(filter)}
                `)
            );
        },
        importFeature: function (
            file: string,
            projectKey?: string,
            projectId?: string,
            source?: string
        ) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(file)}
                      arg 2: ${JSON.stringify(projectKey)}
                      arg 3: ${JSON.stringify(projectId)}
                      arg 4: ${JSON.stringify(source)}
                `)
            );
        },
        importExecutionCucumberMultipart: function (
            cucumberJson: CucumberMultipartFeature[],
            cucumberInfo: ICucumberMultipartInfo
        ) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(cucumberJson)}
                      arg 2: ${JSON.stringify(cucumberInfo)}
                `)
            );
        },
        getTestTypes: function (projectKey: string, ...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(projectKey)}
                      arg 2: ${JSON.stringify(issueKeys)}
                `)
            );
        },
    };
    return makeTransparent(Sinon.stub(client));
}

export function getMockedJiraFieldRepository(): SinonStubbedInstance<IJiraFieldRepository> {
    const fieldRepository: IJiraFieldRepository = {
        getFieldId: function (fieldName: SupportedFields) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(fieldName)}
                `)
            );
        },
    };
    return makeTransparent(Sinon.stub(fieldRepository));
}

export function getMockedJiraIssueFetcher(): SinonStubbedInstance<IJiraIssueFetcher> {
    const jiraIssueFetcher: IJiraIssueFetcher = {
        fetchDescriptions: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(issueKeys)}
                `)
            );
        },
        fetchLabels: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(issueKeys)}
                `)
            );
        },
        fetchSummaries: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(issueKeys)}
                `)
            );
        },
        fetchTestTypes: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(issueKeys)}
                `)
            );
        },
    };
    return makeTransparent(Sinon.stub(jiraIssueFetcher));
}

export function getMockedJiraRepository(): SinonStubbedInstance<IJiraRepository> {
    const jiraRepository: IJiraRepository = {
        getFieldId: function (fieldName: SupportedFields) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(fieldName)}
                `)
            );
        },
        getDescriptions: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(issueKeys)}
                `)
            );
        },
        getLabels: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(issueKeys)}
                `)
            );
        },
        getSummaries: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(issueKeys)}
                `)
            );
        },
        getTestTypes: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                      arg 1: ${JSON.stringify(issueKeys)}
                `)
            );
        },
    };
    return makeTransparent(Sinon.stub(jiraRepository));
}

export function getMockedJWTCredentials(): SinonStubbedInstance<JWTCredentials> {
    return makeTransparent(Sinon.stub(new JWTCredentials("abc", "xyz", "https://example.org")));
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
    const wrappedMethod = f["restore"];
    if (
        wrappedMethod === null ||
        typeof wrappedMethod !== "function" ||
        !("sinon" in wrappedMethod)
    ) {
        return false;
    }
    return wrappedMethod["sinon"] === true;
}
