import { JiraClientCloud } from "../../client/jira/jiraClientCloud";
import { JiraClientServer } from "../../client/jira/jiraClientServer";
import { XrayClientCloud } from "../../client/xray/xrayClientCloud";
import { XrayClientServer } from "../../client/xray/xrayClientServer";
import { logError } from "../../logging/logging";
import { FieldDetailCloud, FieldDetailServer } from "../../types/jira/responses/fieldDetail";
import { IssueCloud, IssueServer } from "../../types/jira/responses/issue";
import { JiraFields, Options } from "../../types/plugin";
import { StringMap } from "../../types/util";
import { dedent } from "../../util/dedent";
import { JiraFieldRepository } from "./fields/jiraFieldRepository";

export type FieldExtractor<T> = {
    extractorFunction: (value: unknown) => T | undefined;
    expectedType: string;
};

export abstract class JiraRepository<
    JiraClientType extends JiraClientServer | JiraClientCloud,
    XrayClientType extends XrayClientServer | XrayClientCloud
> {
    protected readonly jiraFieldRepository: JiraFieldRepository;
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

    private readonly summaries: StringMap<string> = {};
    private readonly descriptions: StringMap<string> = {};
    private readonly testTypes: StringMap<string> = {};

    constructor(jiraClient: JiraClientType, xrayClient: XrayClientType, options: Options) {
        this.jiraFieldRepository = new JiraFieldRepository(jiraClient, options);
        this.jiraClient = jiraClient;
        this.xrayClient = xrayClient;
        this.options = options;
    }

    public async getFieldId(fieldName: string, optionName: keyof JiraFields): Promise<string> {
        return await this.jiraFieldRepository.getFieldId(fieldName, {
            onFetchError: () => {
                throw new Error(`Failed to fetch Jira field ID for field with name: ${fieldName}`);
            },
            onMultipleFieldsError: (duplicates: FieldDetailServer[] | FieldDetailCloud[]) => {
                throw new Error(
                    dedent(`
                        Failed to fetch Jira field ID for field with name: ${fieldName}
                        There are multiple fields with this name

                        Duplicates:
                          ${duplicates
                              .map((field: FieldDetailServer | FieldDetailCloud) =>
                                  Object.entries(field)
                                      .map(([key, value]) => `${key}: ${value}`)
                                      .join(", ")
                              )
                              .join("\n")}

                        You can provide field IDs in the options:

                          jira: {
                            fields = {
                              "${optionName}": {
                                id: // ${duplicates
                                    .map(
                                        (field: FieldDetailServer | FieldDetailCloud) =>
                                            `"${field.id}"`
                                    )
                                    .join(" or ")}
                              }
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

                            You can provide field translations in the options:

                              jira: {
                                fields = {
                                  ${optionName}: {
                                    name: // translation
                                  }
                                }
                              }

                            Alternatively, you can provide the ID directly without relying on language settings:

                              jira: {
                                fields = {
                                  ${optionName}: {
                                    id: // corresponding field ID
                                  }
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

                            You can provide field translations in the options:

                              jira: {
                                fields = {
                                  ${optionName}: {
                                    name: // translation
                                  }
                                }
                              }

                            Alternatively, you can provide the ID directly without relying on language settings:

                              jira: {
                                fields = {
                                  ${optionName}: {
                                    id: // corresponding field ID
                                  }
                                }
                              }
                        `)
                    );
                }
            },
        });
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
                    ${error instanceof Error ? error.message : JSON.stringify(error)}
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
                    ${error instanceof Error ? error.message : JSON.stringify(error)}
                `)
            );
        }
        return result;
    }

    protected async fetchSummaries(...issueKeys: string[]): Promise<StringMap<string>> {
        let fieldId = this.options.jira.fields.summary.id;
        if (!fieldId) {
            const fieldName = this.options.jira.fields.summary.name;
            fieldId = await this.getFieldId(fieldName, "summary");
        }
        // Field property example:
        // summary: "Bug 12345"
        return await this.extractJiraField(fieldId, JiraRepository.STRING_EXTRACTOR, ...issueKeys);
    }

    protected async fetchDescriptions(...issueKeys: string[]): Promise<StringMap<string>> {
        let fieldId = this.options.jira.fields.description.id;
        if (!fieldId) {
            const fieldName = this.options.jira.fields.description.name;
            fieldId = await this.getFieldId(fieldName, "description");
        }
        // Field property example:
        // description: "This is a description"
        return await this.extractJiraField(fieldId, JiraRepository.STRING_EXTRACTOR, ...issueKeys);
    }

    protected abstract fetchTestTypes(...issueKeys: string[]): Promise<StringMap<string>>;

    protected async extractJiraField<T>(
        fieldId: string,
        extractor: FieldExtractor<T>,
        ...issueKeys: string[]
    ): Promise<StringMap<T>> {
        const results: StringMap<T> = {};
        const issues: IssueServer[] | IssueCloud[] = await this.jiraClient.search({
            jql: `project = ${this.options.jira.projectKey} AND issue in (${issueKeys.join(",")})`,
            fields: [fieldId],
        });
        if (issues) {
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
