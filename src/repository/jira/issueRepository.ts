import { JiraClientCloud } from "../../client/jira/jiraClientCloud";
import { JiraClientServer } from "../../client/jira/jiraClientServer";
import { XrayClientCloud } from "../../client/xray/xrayClientCloud";
import { XrayClientServer } from "../../client/xray/xrayClientServer";
import { logWarning } from "../../logging/logging";
import { IssueCloud, IssueServer } from "../../types/jira/responses/issue";
import { Options } from "../../types/plugin";

export interface FieldResponse<T> {
    [key: string]: T;
}

export abstract class IssueRepository<
    XrayClientType extends XrayClientServer | XrayClientCloud,
    JiraClientType extends JiraClientServer | JiraClientCloud
> {
    protected readonly xrayClient: XrayClientType;
    protected readonly jiraClient: JiraClientType;
    protected readonly options: Options;

    private readonly fieldIds: { [key: string]: string } = {};
    private readonly summaries: FieldResponse<string> = {};
    private readonly descriptions: FieldResponse<string> = {};
    private readonly testTypes: FieldResponse<string> = {};

    constructor(jiraClient: JiraClientType, options: Options) {
        this.jiraClient = jiraClient;
        this.options = options;
    }

    public async getSummaries(...issueKeys: string[]): Promise<string[]> {
        const missingSummaries: string[] = await this.fetchFields(
            this.summaries,
            this.fetchSummaries,
            ...issueKeys
        );
        if (missingSummaries.length > 0) {
            throw new Error(`Failed to fetch summaries of issues: ${missingSummaries.join(",")}`);
        }
        return issueKeys.map((key) => this.summaries[key]);
    }

    public async getDescriptions(...issueKeys: string[]): Promise<string[]> {
        const missingDescriptions: string[] = await this.fetchFields(
            this.descriptions,
            this.fetchDescriptions,
            ...issueKeys
        );
        if (missingDescriptions.length > 0) {
            throw new Error(
                `Failed to fetch descriptions of issues: ${missingDescriptions.join(",")}`
            );
        }
        return issueKeys.map((key) => this.descriptions[key]);
    }

    public async getTestTypes(...issueKeys: string[]): Promise<string[]> {
        const missingTestTypes: string[] = await this.fetchFields(
            this.descriptions,
            this.fetchTestTypes,
            ...issueKeys
        );
        if (missingTestTypes.length > 0) {
            throw new Error(`Failed to fetch test types of issues: ${missingTestTypes.join(",")}`);
        }
        return issueKeys.map((key) => this.testTypes[key]);
    }

    protected async fetchSummaries(...issueKeys: string[]): Promise<FieldResponse<string>> {
        // Field property example:
        // summary: "Bug 12345"
        return await this.getJiraField("summary", this.stringExtractor, ...issueKeys);
    }

    protected async fetchDescriptions(...issueKeys: string[]): Promise<FieldResponse<string>> {
        // Field property example:
        // description: "This is a description"
        return await this.getJiraField("description", this.stringExtractor, ...issueKeys);
    }

    protected async fetchTestTypes(...issueKeys: string[]): Promise<FieldResponse<string>> {
        // Field property example:
        // customfield_12100: {
        //   value: "Cucumber",
        //   id: "12702",
        //   disabled: false
        // }
        return await this.getJiraField("Test Type", this.valueExtractor, ...issueKeys);
    }

    private async fetchFields<T>(
        existingFields: FieldResponse<T>,
        fetcher: (...issueKeys: string[]) => Promise<FieldResponse<T>>,
        ...issueKeys: string[]
    ): Promise<string[]> {
        const missingFields: string[] = issueKeys.filter((key: string) => !(key in existingFields));
        if (missingFields.length > 0) {
            const fetchedFields = await fetcher(...missingFields);
            for (let i = missingFields.length - 1; i >= 0; i--) {
                const key = missingFields[i];
                if (key in fetchedFields) {
                    existingFields[key] = fetchedFields[key];
                    missingFields.pop();
                }
            }
        }
        return missingFields;
    }

    protected async getJiraField<T>(
        field: string,
        extractor: (value: unknown) => T,
        ...issueKeys: string[]
    ): Promise<FieldResponse<T>> {
        const results: FieldResponse<T> = {};
        if (!(field in this.fieldIds)) {
            const jiraFields = await this.jiraClient.getFields();
            jiraFields.forEach((jiraField) => {
                this.fieldIds[jiraField.name] = jiraField.id;
            });
        }
        const fieldId = this.fieldIds[field];
        if (fieldId !== undefined) {
            const issues: IssueServer[] | IssueCloud[] = await this.jiraClient.search({
                jql: `project = ${this.options.jira.projectKey} AND issue in (${issueKeys.join(
                    ","
                )})`,
                fields: [fieldId],
            });
            issues.forEach((issue: IssueServer | IssueCloud) => {
                const value = extractor(issue.fields[field]);
                if (value !== undefined) {
                    results[issue.key] = value;
                }
            });
        } else {
            logWarning(`Failed to fetch Jira field ID for field: ${field}`);
        }
        return results;
    }

    private stringExtractor(value: unknown): string | undefined {
        if (typeof value === "string") {
            return value;
        }
    }

    private valueExtractor(data: unknown): string | undefined {
        if (typeof data === "object" && data !== null) {
            return data["value"];
        }
    }
}
