import { IJiraClient } from "../../../client/jira/jiraClient";
import { IFieldDetail } from "../../../types/jira/responses/fieldDetail";
import { IIssue } from "../../../types/jira/responses/issue";
import { JiraFieldIds } from "../../../types/plugin";
import { StringMap } from "../../../types/util";
import { dedent } from "../../../util/dedent";
import { IJiraFieldRepository } from "./jiraFieldRepository";

export interface FieldExtractor<T> {
    extractorFunction: (value: unknown) => T | undefined;
    expectedType: string;
}

export async function getFieldString(
    jiraClient: IJiraClient,
    fieldId: string,
    ...issueKeys: string[]
): Promise<StringMap<string>> {
    return getJiraField(
        jiraClient,
        fieldId,
        {
            extractorFunction: (value: unknown): string | undefined => {
                if (typeof value === "string") {
                    return value;
                }
            },
            expectedType: "a string",
        },
        ...issueKeys
    );
}

export async function getFieldArrayOfStrings(
    jiraClient: IJiraClient,
    fieldId: string,
    ...issueKeys: string[]
): Promise<StringMap<string[]>> {
    return getJiraField(
        jiraClient,
        fieldId,
        {
            extractorFunction: (value: unknown): string[] | undefined => {
                if (Array.isArray(value) && value.every((element) => typeof element === "string")) {
                    return value;
                }
            },
            expectedType: "an array of strings",
        },
        ...issueKeys
    );
}

export async function getFieldObjectWithValue(
    jiraClient: IJiraClient,
    fieldId: string,
    ...issueKeys: string[]
): Promise<StringMap<string>> {
    return getJiraField(
        jiraClient,
        fieldId,
        {
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
        },
        ...issueKeys
    );
}

async function getJiraField<T>(
    jiraClient: IJiraClient,
    fieldId: string,
    extractor: FieldExtractor<T>,
    ...issueKeys: string[]
): Promise<StringMap<T>> {
    const results: StringMap<T> = {};
    const issues: IIssue[] | undefined = await jiraClient.search({
        jql: `issue in (${issueKeys.join(",")})`,
        fields: [fieldId],
    });
    if (issues) {
        const issuesWithUnparseableField: string[] = [];
        issues.forEach((issue: IIssue) => {
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

export enum SupportedField {
    DESCRIPTION = "description",
    SUMMARY = "summary",
    LABELS = "labels",
    TEST_ENVIRONMENTS = "test environments",
    TEST_PLAN = "test plan",
    TEST_TYPE = "test type",
}

export async function getFieldId(
    jiraFieldRepository: IJiraFieldRepository,
    fieldName: SupportedField,
    optionName: keyof JiraFieldIds
): Promise<string> {
    const onFetchError = new Error(
        `Failed to fetch Jira field ID for field with name: ${fieldName}`
    );
    const fieldId = await jiraFieldRepository.getFieldId(fieldName, {
        onFetchError: () => {
            throw onFetchError;
        },
        onMultipleFieldsError: (duplicates: IFieldDetail[]) => {
            const nameDuplicates = duplicates
                .map((field: IFieldDetail) =>
                    Object.entries(field)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ")
                )
                .join("\n");
            const idSuggestions = duplicates
                .map((field: IFieldDetail) => `"${field.id}"`)
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
