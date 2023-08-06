import { JiraClientCloud } from "../../client/jira/jiraClientCloud";
import { JiraClientServer } from "../../client/jira/jiraClientServer";
import { FieldDetailCloud, FieldDetailServer } from "../../types/jira/responses/fieldDetail";
import { IssueCloud, IssueServer } from "../../types/jira/responses/issue";
import { JiraFieldIds, Options } from "../../types/plugin";
import { StringMap } from "../../types/util";
import { dedent } from "../../util/dedent";
import { JiraFieldRepository } from "./fields/jiraFieldRepository";
import { FieldName } from "./jiraRepository";

export type FieldExtractor<T> = {
    extractorFunction: (value: unknown) => T | undefined;
    expectedType: string;
};

export const STRING_EXTRACTOR: FieldExtractor<string> = {
    extractorFunction: (value: unknown): string | undefined => {
        if (typeof value === "string") {
            return value;
        }
    },
    expectedType: "a string",
};

export const ARRAY_STRING_EXTRACTOR: FieldExtractor<string[]> = {
    extractorFunction: (value: unknown): string[] | undefined => {
        if (Array.isArray(value) && value.every((element) => typeof element === "string")) {
            return value;
        }
    },
    expectedType: "an array of strings",
};

export const OBJECT_VALUE_EXTRACTOR: FieldExtractor<string> = {
    extractorFunction: (data: unknown): string | undefined => {
        if (typeof data === "object" && data !== null) {
            return data["value"];
        }
    },
    expectedType: "an object with a value property",
};

export abstract class JiraIssueFieldRepository<T> {
    protected readonly jiraFieldRepository: JiraFieldRepository;
    protected readonly jiraClient: JiraClientServer | JiraClientCloud;
    protected readonly options: Options;

    private readonly fieldData: StringMap<T> = {};

    constructor(
        jiraFieldRepository: JiraFieldRepository,
        jiraClient: JiraClientServer | JiraClientCloud,
        options: Options
    ) {
        this.jiraFieldRepository = jiraFieldRepository;
        this.jiraClient = jiraClient;
        this.options = options;
    }

    public abstract getFieldName(): FieldName;

    public abstract getFieldId(): string | undefined;

    public abstract getOptionName(): keyof JiraFieldIds;

    public async getFieldData(...issueKeys: string[]): Promise<StringMap<T>> {
        const result: StringMap<T> = {};
        const issuesWithMissingField: string[] = issueKeys.filter(
            (key: string) => !(key in this.fieldData)
        );
        if (issuesWithMissingField.length > 0) {
            const fetchedFields = await this.extractJiraField(...issuesWithMissingField);
            issueKeys.forEach((key: string) => {
                if (key in fetchedFields) {
                    this.fieldData[key] = fetchedFields[key];
                }
            });
        }
        issueKeys.forEach((key: string) => {
            if (key in this.fieldData) {
                result[key] = this.fieldData[key];
            }
        });
        return result;
    }

    protected abstract getFieldExtractor(): FieldExtractor<T>;

    private async extractJiraField(...issueKeys: string[]): Promise<StringMap<T>> {
        const results: StringMap<T> = {};
        let fieldId = this.getFieldId();
        if (!fieldId) {
            fieldId = await this.jiraFieldRepository.getFieldId(this.getFieldName(), {
                onFetchError: () => {
                    throw new Error(
                        `Failed to fetch Jira field ID for field with name: ${this.getFieldName()}`
                    );
                },
                onMultipleFieldsError: (duplicates: FieldDetailServer[] | FieldDetailCloud[]) => {
                    throw new Error(
                        dedent(`
                            Failed to fetch Jira field ID for field with name: ${this.getFieldName()}
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
                                  ${this.getOptionName()}: {
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
                                Failed to fetch Jira field ID for field with name: ${this.getFieldName()}
                                Make sure the field actually exists and that your Jira language settings did not modify the field's name

                                You can provide field IDs directly without relying on language settings:

                                  jira: {
                                    fields = {
                                      ${this.getOptionName()}: {
                                        id: // corresponding field ID
                                      }
                                    }
                                  }
                            `)
                        );
                    } else {
                        throw new Error(
                            dedent(`
                                Failed to fetch Jira field ID for field with name: ${this.getFieldName()}
                                Make sure the field actually exists and that your Jira language settings did not modify the field's name

                                Available fields:
                                  ${availableFields.join("\n")}

                                You can provide field IDs directly without relying on language settings:

                                  jira: {
                                    fields = {
                                      ${this.getOptionName()}: {
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
        const issues: IssueServer[] | IssueCloud[] = await this.jiraClient.search({
            jql: `project = ${this.options.jira.projectKey} AND issue in (${issueKeys.join(",")})`,
            fields: [fieldId],
        });
        if (issues) {
            const extractor = this.getFieldExtractor();
            const issuesWithUnparseableField: string[] = [];
            issues.forEach((issue: IssueServer | IssueCloud) => {
                const value = extractor.extractorFunction(issue.fields[fieldId]);
                if (value !== undefined) {
                    results[issue.key] = value;
                } else {
                    issuesWithUnparseableField.push(
                        `${issue.key}: ${this.getFieldName()}: ${JSON.stringify(
                            issue.fields[fieldId]
                        )}`
                    );
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
}
