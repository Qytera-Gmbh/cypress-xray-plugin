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
                    issueIdOrKey: ${JSON.stringify(issueIdOrKey)}
                    files: ${JSON.stringify(files)}
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
                    request: ${JSON.stringify(request)}
                `)
            );
        },
        editIssue: function (issueIdOrKey: string, issueUpdateData: IIssueUpdate) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                    issueIdOrKey: ${JSON.stringify(issueIdOrKey)}
                    issueUpdateData: ${JSON.stringify(issueUpdateData)}
                `)
            );
        },
    };
    return Sinon.stub(client);
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
                        execution: ${JSON.stringify(execution)}
                    `)
                );
            },
            exportCucumber: function (keys?: string[], filter?: number) {
                throw new Error(
                    dedent(`
                        Mock called unexpectedly with args:
                        keys: ${JSON.stringify(keys)}
                        filter: ${JSON.stringify(filter)}
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
                        file: ${JSON.stringify(file)}
                        projectKey: ${JSON.stringify(projectKey)}
                        projectId: ${JSON.stringify(projectId)}
                        source: ${JSON.stringify(source)}
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
                        cucumberJson: ${JSON.stringify(cucumberJson)}
                        cucumberInfo: ${JSON.stringify(cucumberInfo)}
                    `)
                );
            },
        };
        return Sinon.stub(client);
    }
    const client: IXrayClientCloud = {
        importExecution: function (execution: IXrayTestExecutionResults) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                    execution: ${JSON.stringify(execution)}
                `)
            );
        },
        exportCucumber: function (keys?: string[], filter?: number) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                    keys: ${JSON.stringify(keys)}
                    filter: ${JSON.stringify(filter)}
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
                    file: ${JSON.stringify(file)}
                    projectKey: ${JSON.stringify(projectKey)}
                    projectId: ${JSON.stringify(projectId)}
                    source: ${JSON.stringify(source)}
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
                    cucumberJson: ${JSON.stringify(cucumberJson)}
                    cucumberInfo: ${JSON.stringify(cucumberInfo)}
                `)
            );
        },
        getTestTypes: function (projectKey: string, ...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                    projectKey: ${JSON.stringify(projectKey)}
                    issueKeys: ${JSON.stringify(issueKeys)}
                `)
            );
        },
    };
    return Sinon.stub(client);
}

export function getMockedJiraFieldRepository(): SinonStubbedInstance<IJiraFieldRepository> {
    const fieldRepository: IJiraFieldRepository = {
        getFieldId: function () {
            throw new Error("Mock called unexpectedly");
        },
    };
    return Sinon.stub(fieldRepository);
}

export function getMockedJiraIssueFetcher(): SinonStubbedInstance<IJiraIssueFetcher> {
    const jiraIssueFetcher: IJiraIssueFetcher = {
        fetchDescriptions: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                    issueKeys: ${JSON.stringify(issueKeys)}
                `)
            );
        },
        fetchLabels: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                    issueKeys: ${JSON.stringify(issueKeys)}
                `)
            );
        },
        fetchSummaries: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                    issueKeys: ${JSON.stringify(issueKeys)}
                `)
            );
        },
        fetchTestTypes: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                    issueKeys: ${JSON.stringify(issueKeys)}
                `)
            );
        },
    };
    return Sinon.stub(jiraIssueFetcher);
}

export function getMockedJiraRepository(): SinonStubbedInstance<IJiraRepository> {
    const jiraRepository: IJiraRepository = {
        getFieldId: function (fieldName: SupportedFields) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                    fieldName: ${JSON.stringify(fieldName)}
                `)
            );
        },
        getDescriptions: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                    issueKeys: ${JSON.stringify(issueKeys)}
                `)
            );
        },
        getLabels: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                    issueKeys: ${JSON.stringify(issueKeys)}
                `)
            );
        },
        getSummaries: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                    issueKeys: ${JSON.stringify(issueKeys)}
                `)
            );
        },
        getTestTypes: function (...issueKeys: string[]) {
            throw new Error(
                dedent(`
                    Mock called unexpectedly with args:
                    issueKeys: ${JSON.stringify(issueKeys)}
                `)
            );
        },
    };
    return Sinon.stub(jiraRepository);
}
