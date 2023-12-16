import { IJiraClient } from "../src/client/jira/jiraClient";
import { IXrayClient } from "../src/client/xray/xrayClient";
import { IXrayClientCloud } from "../src/client/xray/xrayClientCloud";
import { IJiraFieldRepository } from "../src/repository/jira/fields/jiraFieldRepository";
import { IJiraIssueFetcher } from "../src/repository/jira/fields/jiraIssueFetcher";
import { IJiraRepository } from "../src/repository/jira/jiraRepository";

export function getMockedJiraClient(): IJiraClient {
    return {
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
}

interface XrayClientMap {
    server: IXrayClient;
    cloud: IXrayClientCloud;
}
export function getMockedXrayClient<T extends keyof XrayClientMap>(kind?: T): XrayClientMap[T];
export function getMockedXrayClient<T extends keyof XrayClientMap>(kind?: T): IXrayClient {
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
        return client;
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
    return client;
}

export function getMockedJiraFieldRepository(): IJiraFieldRepository {
    return {
        getFieldId: function () {
            throw new Error("Mock called unexpectedly");
        },
    };
}

export function getMockedJiraIssueFetcher(): IJiraIssueFetcher {
    return {
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
}

export function getMockedJiraRepository(): IJiraRepository {
    return {
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
}
