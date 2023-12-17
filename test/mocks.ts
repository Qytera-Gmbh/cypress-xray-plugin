import Sinon, { SinonStubbedInstance } from "sinon";
import { IJiraClient } from "../src/client/jira/jiraClient";
import { IXrayClient } from "../src/client/xray/xrayClient";
import { IXrayClientCloud } from "../src/client/xray/xrayClientCloud";
import { IJiraFieldRepository } from "../src/repository/jira/fields/jiraFieldRepository";
import { IJiraIssueFetcher, SupportedFields } from "../src/repository/jira/fields/jiraIssueFetcher";
import { IJiraRepository } from "../src/repository/jira/jiraRepository";
import { ISearchRequest } from "../src/types/jira/requests/search";
import { IIssueUpdate } from "../src/types/jira/responses/issueUpdate";
import { IXrayTestExecutionResults } from "../src/types/xray/importTestExecutionResults";
import { CucumberMultipartFeature } from "../src/types/xray/requests/importExecutionCucumberMultipart";
import { ICucumberMultipartInfo } from "../src/types/xray/requests/importExecutionCucumberMultipartInfo";
import { dedent } from "../src/util/dedent";

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
