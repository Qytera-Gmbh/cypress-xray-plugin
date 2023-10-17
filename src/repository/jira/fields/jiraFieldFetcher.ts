import { IJiraClient } from "../../../client/jira/jiraClient";
import { XrayClientCloud } from "../../../client/xray/xrayClientCloud";
import { InternalJiraOptions, JiraFieldIds } from "../../../types/plugin";
import { StringMap } from "../../../types/util";
import {
    SupportedField,
    getFieldArrayOfStrings,
    getFieldId,
    getFieldObjectWithValue,
    getFieldString,
} from "./fetching";
import { IJiraFieldRepository, JiraFieldRepository } from "./jiraFieldRepository";

export interface IJiraFieldFetcher {
    fetchDescriptions(...issueKeys: string[]): Promise<StringMap<string>>;
    fetchLabels(...issueKeys: string[]): Promise<StringMap<string[]>>;
    fetchSummaries(...issueKeys: string[]): Promise<StringMap<string>>;
    fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>>;
}

export class JiraFieldFetcher implements IJiraFieldFetcher {
    private readonly jiraClient: IJiraClient;
    private readonly jiraFieldRepository: IJiraFieldRepository;
    private readonly fieldIds?: JiraFieldIds;

    constructor(
        jiraClient: IJiraClient,
        jiraFieldRepository: IJiraFieldRepository,
        fieldIds?: JiraFieldIds
    ) {
        this.jiraClient = jiraClient;
        this.jiraFieldRepository = jiraFieldRepository;
        this.fieldIds = fieldIds;
    }

    public async fetchSummaries(...issueKeys: string[]): Promise<StringMap<string>> {
        let summaryId = this.fieldIds?.summary;
        if (!summaryId) {
            summaryId = await getFieldId(
                this.jiraFieldRepository,
                SupportedField.SUMMARY,
                "summary"
            );
        }
        // Field property example:
        // summary: "Bug 12345"
        return await getFieldString(this.jiraClient, summaryId, ...issueKeys);
    }

    public async fetchDescriptions(...issueKeys: string[]): Promise<StringMap<string>> {
        let descriptionId = this.fieldIds?.description;
        if (!descriptionId) {
            descriptionId = await getFieldId(
                this.jiraFieldRepository,
                SupportedField.DESCRIPTION,
                "description"
            );
        }
        // Field property example:
        // description: "This is a description"
        return await getFieldString(this.jiraClient, descriptionId, ...issueKeys);
    }

    public async fetchLabels(...issueKeys: string[]): Promise<StringMap<string[]>> {
        let labelsId = this.fieldIds?.labels;
        if (!labelsId) {
            labelsId = await getFieldId(this.jiraFieldRepository, SupportedField.LABELS, "labels");
        }
        // Field property example:
        // labels: ["regression", "quality"]
        return await getFieldArrayOfStrings(this.jiraClient, labelsId, ...issueKeys);
    }

    public async fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>> {
        let testTypeId = this.fieldIds?.testType;
        if (!testTypeId) {
            testTypeId = await getFieldId(
                this.jiraFieldRepository,
                SupportedField.TEST_TYPE,
                "testType"
            );
        }
        // Field property example:
        // customfield_12100: {
        //   value: "Cucumber",
        //   id: "12702",
        //   disabled: false
        // }
        return await getFieldObjectWithValue(this.jiraClient, testTypeId, ...issueKeys);
    }
}

export class JiraFieldFetcherCloud extends JiraFieldFetcher {
    private readonly xrayClient: XrayClientCloud;
    private readonly jiraOptions: InternalJiraOptions;

    constructor(
        jiraClient: IJiraClient,
        jiraFieldRepository: JiraFieldRepository,
        xrayClient: XrayClientCloud,
        jiraOptions: InternalJiraOptions
    ) {
        super(jiraClient, jiraFieldRepository, jiraOptions.fields);
        this.xrayClient = xrayClient;
        this.jiraOptions = jiraOptions;
    }

    public async fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>> {
        return await this.xrayClient.getTestTypes(this.jiraOptions.projectKey, ...issueKeys);
    }
}
