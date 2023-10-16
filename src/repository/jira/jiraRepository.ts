import { JiraClientCloud } from "../../client/jira/jiraClientCloud";
import { JiraClientServer } from "../../client/jira/jiraClientServer";
import { XrayClientCloud } from "../../client/xray/xrayClientCloud";
import { XrayClientServer } from "../../client/xray/xrayClientServer";
import { logError } from "../../logging/logging";
import { FieldDetailCloud, FieldDetailServer } from "../../types/jira/responses/fieldDetail";
import { IssueCloud, IssueServer } from "../../types/jira/responses/issue";
import { InternalJiraOptions, JiraFieldIds } from "../../types/plugin";
import { StringMap } from "../../types/util";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/errors";
import { JiraFieldRepository } from "./fields/jiraFieldRepository";

export type FieldExtractor<T> = {
    extractorFunction: (value: unknown) => T | undefined;
    expectedType: string;
};

export type FieldName =
    | "description"
    | "summary"
    | "labels"
    | "test environments"
    | "test plan"
    | "test type";

export abstract class JiraRepository<
    JiraClientType extends JiraClientServer | JiraClientCloud,
    XrayClientType extends XrayClientServer | XrayClientCloud
> {
    protected readonly jiraFieldRepository: JiraFieldRepository;
    protected readonly jiraClient: JiraClientType;
    protected readonly xrayClient: XrayClientType;
    protected readonly jiraOptions: InternalJiraOptions;

    protected static readonly STRING_EXTRACTOR: FieldExtractor<string> = {
        extractorFunction: (value: unknown): string | undefined => {
            if (typeof value === "string") {
                return value;
            }
        },
        expectedType: "a string",
    };

    protected static readonly ARRAY_STRING_EXTRACTOR: FieldExtractor<string[]> = {
        extractorFunction: (value: unknown): string[] | undefined => {
            if (Array.isArray(value) && value.every((element) => typeof element === "string")) {
                return value;
            }
        },
        expectedType: "an array of strings",
    };

    protected static readonly OBJECT_VALUE_EXTRACTOR: FieldExtractor<string> = {
        extractorFunction: (data: unknown): string | undefined => {
            if (
                typeof data === "object" &&
                data !== null &&
                "value" in data &&
                typeof data["value"] === "string"
            ) {
                return data["value"];
            }
        },
        expectedType: "an object with a value property",
    };

    private readonly summaries: StringMap<string> = {};
    private readonly descriptions: StringMap<string> = {};
    private readonly testTypes: StringMap<string> = {};
    private readonly labels: StringMap<string[]> = {};

    constructor(
        jiraClient: JiraClientType,
        xrayClient: XrayClientType,
        jiraOptions: InternalJiraOptions
    ) {
        this.jiraFieldRepository = new JiraFieldRepository(jiraClient, jiraOptions);
        this.jiraClient = jiraClient;
        this.xrayClient = xrayClient;
        this.jiraOptions = jiraOptions;
    }

    public async getFieldId(fieldName: FieldName, optionName: keyof JiraFieldIds): Promise<string> {
        const onFetchError = new Error(
            `Failed to fetch Jira field ID for field with name: ${fieldName}`
        );
        const fieldId = await this.jiraFieldRepository.getFieldId(fieldName, {
            onFetchError: () => {
                throw onFetchError;
            },
            onMultipleFieldsError: (duplicates: FieldDetailServer[] | FieldDetailCloud[]) => {
                const nameDuplicates = duplicates
                    .map((field: FieldDetailServer | FieldDetailCloud) =>
                        Object.entries(field)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(", ")
                    )
                    .join("\n");
                const idSuggestions = duplicates
                    .map((field: FieldDetailServer | FieldDetailCloud) => `"${field.id}"`)
                    .join(" or ");
                throw new Error(
                    dedent(`
                        Failed to fetch Jira field ID for field with name: ${fieldName}
                        There are multiple fields with this name

                        Duplicates:
                          ${nameDuplicates}

                        You can provide field IDs in the options:

                          jira: {
                            fields: {
                              ${optionName}: <id> // ${idSuggestions}
                            }
                          }
                    `)
                );
            },
            onMissingFieldError: (availableFields: string[]) => {
                if (availableFields.length === 0) {
                    throw new Error(
                        dedent(`
                            Failed to fetch Jira field ID for field with name: ${fieldName}
                            Make sure the field actually exists and that your Jira language settings did not modify the field's name

                            You can provide field IDs directly without relying on language settings:

                              jira: {
                                fields: {
                                  ${optionName}: <id> // corresponding field ID
                                }
                              }
                        `)
                    );
                } else {
                    throw new Error(
                        dedent(`
                            Failed to fetch Jira field ID for field with name: ${fieldName}
                            Make sure the field actually exists and that your Jira language settings did not modify the field's name

                            Available fields:
                              ${availableFields.join("\n")}

                            You can provide field IDs directly without relying on language settings:

                              jira: {
                                fields: {
                                  ${optionName}: <id> // corresponding field ID
                                }
                              }
                        `)
                    );
                }
            },
        });
        if (!fieldId) {
            throw onFetchError;
        }
        return fieldId;
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
                throw new Error(
                    dedent(`
                        Make sure these issues exist:

                          ${missingSummaries.join("\n")}
                    `)
                );
            }
        } catch (error: unknown) {
            logError(
                dedent(`
                    Failed to fetch issue summaries
                    ${errorMessage(error)}
                `)
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
                    dedent(`
                        Make sure these issues exist:

                          ${missingDescriptions.join("\n")}
                    `)
                );
            }
        } catch (error: unknown) {
            logError(
                dedent(`
                    Failed to fetch issue descriptions
                    ${errorMessage(error)}
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
                    dedent(`
                        Make sure these issues exist and are test issues:

                          ${missingTestTypes.join("\n")}
                    `)
                );
            }
        } catch (error: unknown) {
            logError(
                dedent(`
                    Failed to fetch issue test types
                    ${errorMessage(error)}
                `)
            );
        }
        return result;
    }

    public async getLabels(...issueKeys: string[]): Promise<StringMap<string[]>> {
        let result: StringMap<string[]> = {};
        try {
            result = await this.fetchFields(this.labels, this.fetchLabels.bind(this), ...issueKeys);
            const missingLabels: string[] = issueKeys.filter(
                (key: string) => !(key in this.labels)
            );
            if (missingLabels.length > 0) {
                throw new Error(
                    dedent(`
                        Make sure these issues exist:

                          ${missingLabels.join("\n")}
                    `)
                );
            }
        } catch (error: unknown) {
            logError(
                dedent(`
                    Failed to fetch issue labels
                    ${errorMessage(error)}
                `)
            );
        }
        return result;
    }

    protected async fetchSummaries(...issueKeys: string[]): Promise<StringMap<string>> {
        let fieldId = this.jiraOptions.fields?.summary;
        if (!fieldId) {
            fieldId = await this.getFieldId("summary", "summary");
        }
        // Field property example:
        // summary: "Bug 12345"
        return await this.extractJiraField(fieldId, JiraRepository.STRING_EXTRACTOR, ...issueKeys);
    }

    protected async fetchDescriptions(...issueKeys: string[]): Promise<StringMap<string>> {
        let fieldId = this.jiraOptions.fields?.description;
        if (!fieldId) {
            fieldId = await this.getFieldId("description", "description");
        }
        // Field property example:
        // description: "This is a description"
        return await this.extractJiraField(fieldId, JiraRepository.STRING_EXTRACTOR, ...issueKeys);
    }

    protected abstract fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>>;

    protected async fetchLabels(...issueKeys: string[]): Promise<StringMap<string[]>> {
        let fieldId = this.jiraOptions.fields?.labels;
        if (!fieldId) {
            fieldId = await this.getFieldId("labels", "labels");
        }
        // Field property example:
        // labels: ["regression", "quality"]
        return await this.extractJiraField(
            fieldId,
            JiraRepository.ARRAY_STRING_EXTRACTOR,
            ...issueKeys
        );
    }

    protected async extractJiraField<T>(
        fieldId: string,
        extractor: FieldExtractor<T>,
        ...issueKeys: string[]
    ): Promise<StringMap<T>> {
        const results: StringMap<T> = {};
        const issues: IssueServer[] | IssueCloud[] | undefined = await this.jiraClient.search({
            jql: `project = ${this.jiraOptions.projectKey} AND issue in (${issueKeys.join(",")})`,
            fields: [fieldId],
        });
        if (issues) {
            const issuesWithUnparseableField: string[] = [];
            issues.forEach((issue: IssueServer | IssueCloud) => {
                if (issue.key && issue.fields && fieldId in issue.fields) {
                    const value = extractor.extractorFunction(issue.fields[fieldId]);
                    if (value !== undefined) {
                        results[issue.key] = value;
                    } else {
                        issuesWithUnparseableField.push(
                            `${issue.key}: ${JSON.stringify(issue.fields[fieldId])}`
                        );
                    }
                }
            });
            if (issuesWithUnparseableField.length > 0) {
                throw new Error(
                    dedent(`
                        Failed to parse Jira field with ID: ${fieldId}
                        Expected the field to be: ${extractor.expectedType}
                        Make sure the correct field is present on the following issues:

                          ${issuesWithUnparseableField.join("\n")}
                    `)
                );
            }
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
