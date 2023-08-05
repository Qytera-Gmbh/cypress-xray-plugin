import dedent from "dedent";
import { JiraClientCloud } from "../../client/jira/jiraClientCloud";
import { JiraClientServer } from "../../client/jira/jiraClientServer";
import { XrayClientCloud } from "../../client/xray/xrayClientCloud";
import { XrayClientServer } from "../../client/xray/xrayClientServer";
import { logError } from "../../logging/logging";
import { IssueCloud, IssueServer } from "../../types/jira/responses/issue";
import { Options } from "../../types/plugin";
import { StringMap } from "../../types/util";

export type FieldExtractor<T> = {
    extractorFunction: (value: unknown) => T | undefined;
    expectedType: string;
};

export abstract class JiraRepository<
    JiraClientType extends JiraClientServer | JiraClientCloud,
    XrayClientType extends XrayClientServer | XrayClientCloud
> {
    protected readonly jiraClient: JiraClientType;
    protected readonly xrayClient: XrayClientType;
    protected readonly options: Options;

    protected static readonly STRING_EXTRACTOR: FieldExtractor<string> = {
        extractorFunction: (value: unknown): string | undefined => {
            if (typeof value === "string") {
                return value;
            }
        },
        expectedType: "a string",
    };

    protected static readonly OBJECT_VALUE_EXTRACTOR: FieldExtractor<string> = {
        extractorFunction: (data: unknown): string | undefined => {
            if (typeof data === "object" && data !== null) {
                return data["value"];
            }
        },
        expectedType: "an object with a value property",
    };

    private readonly fieldIds: StringMap<string> = {};
    private readonly summaries: StringMap<string> = {};
    private readonly descriptions: StringMap<string> = {};
    private readonly testTypes: StringMap<string> = {};

    constructor(jiraClient: JiraClientType, xrayClient: XrayClientType, options: Options) {
        this.jiraClient = jiraClient;
        this.xrayClient = xrayClient;
        this.options = options;
    }

    public async getFieldId(fieldName: string): Promise<string> {
        // Lowercase everything to work around case sensitivities.
        // Jira sometimes returns field names capitalized, sometimes it doesn't.
        const lowerCasedName = fieldName.toLowerCase();
        if (!(lowerCasedName in this.fieldIds)) {
            const jiraFields = await this.jiraClient.getFields();
            if (jiraFields) {
                const matches = jiraFields.filter((field) => {
                    const lowerCasedField = field.name.toLowerCase();
                    return lowerCasedField === lowerCasedName;
                });
                if (matches.length === 0) {
                    throw new Error(
                        dedent(`
                            Failed to fetch Jira field ID for field with name: ${lowerCasedName}
                            Make sure the field actually exists
                        `)
                    );
                } else if (matches.length > 1) {
                    throw new Error(
                        dedent(`
                            Failed to fetch Jira field ID for field with name: ${lowerCasedName}
                            There are multiple fields with this name:

                            ${matches.map((field) => JSON.stringify(field)).join("\n")}

                            Make sure to set option jira.fields["${fieldName}"] to the ID of the field you want:

                            jira.fields = {
                                "${fieldName}": {
                                    id: // ${matches.map((field) => `"${field.id}"`).join(" or ")}
                                }
                            }
                        `)
                    );
                }
                jiraFields.forEach((jiraField) => {
                    this.fieldIds[jiraField.name.toLowerCase()] = jiraField.id;
                });
            }
        }
        return this.fieldIds[lowerCasedName];
    }

    public async getSummaries(...issueKeys: string[]): Promise<StringMap<string>> {
        let result: StringMap<string> = {};
        try {
            result = await this.fetchFields(
                this.summaries,
                this.fetchSummaries.bind(this),
                ...issueKeys
            );
            const missingSummaries: string[] = issueKeys.filter(
                (key: string) => !(key in this.summaries)
            );
            if (missingSummaries.length > 0) {
                throw new Error(`Make sure these issues exist:\n\n${missingSummaries.join("\n")}`);
            }
        } catch (error: unknown) {
            logError(
                `Failed to fetch issue summaries\n${
                    error instanceof Error ? error.message : JSON.stringify(error)
                }`
            );
        }
        return result;
    }

    public async getDescriptions(...issueKeys: string[]): Promise<StringMap<string>> {
        let result: StringMap<string> = {};
        try {
            result = await this.fetchFields(
                this.descriptions,
                this.fetchDescriptions.bind(this),
                ...issueKeys
            );
            const missingDescriptions: string[] = issueKeys.filter(
                (key: string) => !(key in this.descriptions)
            );
            if (missingDescriptions.length > 0) {
                throw new Error(
                    `Make sure these issues exist:\n\n${missingDescriptions.join("\n")}`
                );
            }
        } catch (error: unknown) {
            logError(
                dedent(`
                    Failed to fetch issue descriptions
                    ${error instanceof Error ? error.message : JSON.stringify(error)}
                `)
            );
        }
        return result;
    }

    public async getTestTypes(...issueKeys: string[]): Promise<StringMap<string>> {
        let result: StringMap<string> = {};
        try {
            result = await this.fetchFields(
                this.testTypes,
                this.fetchTestTypes.bind(this),
                ...issueKeys
            );
            const missingTestTypes: string[] = issueKeys.filter(
                (key: string) => !(key in this.testTypes)
            );
            if (missingTestTypes.length > 0) {
                throw new Error(
                    `Make sure these issues exist and are test issues:\n\n${missingTestTypes.join(
                        "\n"
                    )}`
                );
            }
        } catch (error: unknown) {
            logError(
                dedent(`
                    Failed to fetch issue test types
                    ${error instanceof Error ? error.message : JSON.stringify(error)}
                `)
            );
        }
        return result;
    }

    protected async fetchSummaries(...issueKeys: string[]): Promise<StringMap<string>> {
        let fieldId = this.options.jira.fields?.summary?.id;
        if (!fieldId) {
            const fieldName = this.options.jira.fields?.summary?.name;
            fieldId = await this.getFieldId(fieldName);
        }
        // Field property example:
        // summary: "Bug 12345"
        return await this.getJiraField(fieldId, JiraRepository.STRING_EXTRACTOR, ...issueKeys);
    }

    protected async fetchDescriptions(...issueKeys: string[]): Promise<StringMap<string>> {
        let fieldId = this.options.jira.fields?.description?.id;
        if (!fieldId) {
            const fieldName = this.options.jira.fields?.description?.name ?? "description";
            fieldId = await this.getFieldId(fieldName);
        }
        // Field property example:
        // description: "This is a description"
        return await this.getJiraField(fieldId, JiraRepository.STRING_EXTRACTOR, ...issueKeys);
    }

    protected abstract fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>>;

    protected async getJiraField<T>(
        fieldId: string,
        extractor: FieldExtractor<T>,
        ...issueKeys: string[]
    ): Promise<StringMap<T>> {
        const issues: IssueServer[] | IssueCloud[] = await this.jiraClient.search({
            jql: `project = ${this.options.jira.projectKey} AND issue in (${issueKeys.join(",")})`,
            fields: [fieldId],
        });
        const results: StringMap<T> = {};
        const issuesWithUnparseableField: string[] = [];
        issues.forEach((issue: IssueServer | IssueCloud) => {
            const value = extractor.extractorFunction(issue.fields[fieldId]);
            if (value !== undefined) {
                results[issue.key] = value;
            } else {
                issuesWithUnparseableField.push(
                    `${issue.key}: ${JSON.stringify(issue.fields[fieldId])}`
                );
            }
        });
        if (issuesWithUnparseableField.length > 0) {
            throw new Error(
                dedent(`
                    Failed to parse the following Jira field of some issues: ${fieldId}
                    Expected the field to be: ${extractor.expectedType}
                    Make sure the correct field is present on the following issues:

                    ${issuesWithUnparseableField.join("\n")}
                `)
            );
        }
        return results;
    }

    private async fetchFields<T>(
        existingFields: StringMap<T>,
        fetcher: (...issueKeys: string[]) => Promise<StringMap<T>>,
        ...issueKeys: string[]
    ): Promise<StringMap<T>> {
        const issuesWithMissingField: string[] = issueKeys.filter(
            (key: string) => !(key in existingFields)
        );
        if (issuesWithMissingField.length > 0) {
            const fetchedFields = await fetcher(...issuesWithMissingField);
            issueKeys.forEach((key: string) => {
                if (key in fetchedFields) {
                    existingFields[key] = fetchedFields[key];
                }
            });
        }
        const result: StringMap<T> = {};
        issueKeys.forEach((key: string) => {
            if (key in existingFields) {
                result[key] = existingFields[key];
            }
        });
        return result;
    }
}
