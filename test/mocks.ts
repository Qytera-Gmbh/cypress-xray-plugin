import Sinon, { SinonStubbedInstance } from "sinon";
import { IJiraClient } from "../src/client/jira/jiraClient";
import { IXrayClient } from "../src/client/xray/xrayClient";
import { IXrayClientCloud } from "../src/client/xray/xrayClientCloud";
import { IJiraFieldRepository } from "../src/repository/jira/fields/jiraFieldRepository";
import { IJiraIssueFetcher } from "../src/repository/jira/fields/jiraIssueFetcher";
import { IJiraRepository } from "../src/repository/jira/jiraRepository";

export function getMockedJiraClient(): SinonStubbedInstance<IJiraClient> {
    const client: IJiraClient = {
        addAttachment: function () {
            throw new Error("Mock called unexpectedly");
        },
        getIssueTypes: function () {
            throw new Error("Mock called unexpectedly");
        },
        getFields: function () {
            throw new Error("Mock called unexpectedly");
        },
        search: function () {
            throw new Error("Mock called unexpectedly");
        },
        editIssue: function () {
            throw new Error("Mock called unexpectedly");
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
            importExecution: function () {
                throw new Error("Mock called unexpectedly");
            },
            exportCucumber: function () {
                throw new Error("Mock called unexpectedly");
            },
            importFeature: function () {
                throw new Error("Mock called unexpectedly");
            },
            importExecutionCucumberMultipart: function () {
                throw new Error("Mock called unexpectedly");
            },
        };
        return Sinon.stub(client);
    }
    const client: IXrayClientCloud = {
        importExecution: function () {
            throw new Error("Mock called unexpectedly");
        },
        exportCucumber: function () {
            throw new Error("Mock called unexpectedly");
        },
        importFeature: function () {
            throw new Error("Mock called unexpectedly");
        },
        importExecutionCucumberMultipart: function () {
            throw new Error("Mock called unexpectedly");
        },
        getTestTypes: function () {
            throw new Error("Mock called unexpectedly");
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
        fetchDescriptions: function () {
            throw new Error("Mock called unexpectedly");
        },
        fetchLabels: function () {
            throw new Error("Mock called unexpectedly");
        },
        fetchSummaries: function () {
            throw new Error("Mock called unexpectedly");
        },
        fetchTestTypes: function () {
            throw new Error("Mock called unexpectedly");
        },
    };
    return Sinon.stub(jiraIssueFetcher);
}

export function getMockedJiraRepository(): SinonStubbedInstance<IJiraRepository> {
    const jiraRepository: IJiraRepository = {
        getFieldId: function () {
            throw new Error("Mock called unexpectedly");
        },
        getDescriptions: function () {
            throw new Error("Mock called unexpectedly");
        },
        getLabels: function () {
            throw new Error("Mock called unexpectedly");
        },
        getSummaries: function () {
            throw new Error("Mock called unexpectedly");
        },
        getTestTypes: function () {
            throw new Error("Mock called unexpectedly");
        },
    };
    return Sinon.stub(jiraRepository);
}
