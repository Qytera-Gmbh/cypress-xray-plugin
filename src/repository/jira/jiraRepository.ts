import { JiraClientCloud } from "../../client/jira/jiraClientCloud";
import { JiraClientServer } from "../../client/jira/jiraClientServer";
import { XrayClientCloud } from "../../client/xray/xrayClientCloud";
import { XrayClientServer } from "../../client/xray/xrayClientServer";
import { logError, logWarning } from "../../logging/logging";
import { IssueCloud, IssueServer } from "../../types/jira/responses/issue";
import { Options } from "../../types/plugin";
import { StringMap } from "../../types/util";

export abstract class JiraRepository<
    JiraClientType extends JiraClientServer | JiraClientCloud,
    XrayClientType extends XrayClientServer | XrayClientCloud
> {
    protected readonly jiraClient: JiraClientType;
    protected readonly xrayClient: XrayClientType;
    protected readonly options: Options;

    private readonly fieldIds: StringMap<string> = {};
    private readonly summaries: StringMap<string> = {};
    private readonly descriptions: StringMap<string> = {};
    private readonly testTypes: StringMap<string> = {};

    constructor(jiraClient: JiraClientType, xrayClient: XrayClientType, options: Options) {
        this.jiraClient = jiraClient;
        this.xrayClient = xrayClient;
        this.options = options;
    }

    public async getSummaries(...issueKeys: string[]): Promise<StringMap<string>> {
        const missingSummaries: string[] = await this.fetchFields(
            this.summaries,
            this.fetchSummaries.bind(this),
            ...issueKeys
        );
        if (missingSummaries.length > 0) {
            logError(`Failed to fetch summaries of issues:\n${missingSummaries.join("\n")}`);
        }
        const result: StringMap<string> = {};
        issueKeys.forEach((key: string) => {
            if (key in this.summaries) {
                result[key] = this.summaries[key];
            }
        });
        return result;
    }

    public async getDescriptions(...issueKeys: string[]): Promise<StringMap<string>> {
        const missingDescriptions: string[] = await this.fetchFields(
            this.descriptions,
            this.fetchDescriptions.bind(this),
            ...issueKeys
        );
        if (missingDescriptions.length > 0) {
            logError(`Failed to fetch descriptions of issues:\n${missingDescriptions.join("\n")}`);
        }
        const result: StringMap<string> = {};
        issueKeys.forEach((key: string) => {
            if (key in this.descriptions) {
                result[key] = this.descriptions[key];
            }
        });
        return result;
    }

    public async getTestTypes(...issueKeys: string[]): Promise<StringMap<string>> {
        const missingTestTypes: string[] = await this.fetchFields(
            this.testTypes,
            this.fetchTestTypes.bind(this),
            ...issueKeys
        );
        if (missingTestTypes.length > 0) {
            logError(`Failed to fetch test types of issues:\n${missingTestTypes.join("\n")}`);
        }
        const result: StringMap<string> = {};
        issueKeys.forEach((key: string) => {
            if (key in this.testTypes) {
                result[key] = this.testTypes[key];
            }
        });
        return result;
    }

    protected abstract fetchSummaries(...issueKeys: string[]): Promise<StringMap<string>>;

    protected abstract fetchDescriptions(...issueKeys: string[]): Promise<StringMap<string>>;

    protected abstract fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>>;

    protected async getJiraField<T>(
        fieldName: string,
        extractor: (value: unknown) => T,
        ...issueKeys: string[]
    ): Promise<StringMap<T>> {
        const results: StringMap<T> = {};
        if (!(fieldName in this.fieldIds)) {
            const jiraFields = await this.jiraClient.getFields();
            if (!jiraFields) {
                return results;
            }
            jiraFields.forEach((jiraField) => {
                this.fieldIds[jiraField.name] = jiraField.id;
            });
        }
        const fieldId = this.fieldIds[fieldName];
        if (fieldId !== undefined) {
            const issues: IssueServer[] | IssueCloud[] = await this.jiraClient.search({
                jql: `project = ${this.options.jira.projectKey} AND issue in (${issueKeys.join(
                    ","
                )})`,
                fields: [fieldId],
            });
            const issuesWithUnparseableField: string[] = [];
            issues.forEach((issue: IssueServer | IssueCloud) => {
                const value = extractor(issue.fields[fieldId]);
                if (value !== undefined) {
                    results[issue.key] = value;
                } else {
                    issuesWithUnparseableField.push(issue.key);
                }
            });
            if (issuesWithUnparseableField.length > 0) {
                logWarning(
                    `Failed to parse the following Jira field of the following issues: ${fieldName}\n${issuesWithUnparseableField.join(
                        "\n"
                    )}`
                );
            }
        } else {
            logWarning(`Failed to fetch Jira field ID for field: ${fieldName}`);
        }
        return results;
    }

    protected stringExtractor(value: unknown): string | undefined {
        if (typeof value === "string") {
            return value;
        }
    }

    protected valueExtractor(data: unknown): string | undefined {
        if (typeof data === "object" && data !== null) {
            return data["value"];
        }
    }

    private async fetchFields<T>(
        existingFields: StringMap<T>,
        fetcher: (...issueKeys: string[]) => Promise<StringMap<T>>,
        ...issueKeys: string[]
    ): Promise<string[]> {
        const issuesWithMissingField: string[] = issueKeys.filter(
            (key: string) => !(key in existingFields)
        );
        if (issuesWithMissingField.length > 0) {
            const fetchedFields = await fetcher(...issuesWithMissingField);
            for (let i = issuesWithMissingField.length - 1; i >= 0; i--) {
                const key = issuesWithMissingField[i];
                if (key in fetchedFields) {
                    existingFields[key] = fetchedFields[key];
                    issuesWithMissingField.splice(i, 1);
                }
            }
        }
        return issuesWithMissingField;
    }
}
