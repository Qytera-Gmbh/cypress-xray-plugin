import { FieldDetail } from "../../../../types/jira/responses/field-detail";
import { JiraFieldIds } from "../../../../types/plugin";
import { StringMap } from "../../../../types/util";
import { dedent } from "../../../../util/dedent";
import { prettyPadObjects, prettyPadValues } from "../../../../util/pretty";
import { Command, Computable } from "../../../command";

export enum JiraField {
    DESCRIPTION = "description",
    SUMMARY = "summary",
    LABELS = "labels",
    TEST_ENVIRONMENTS = "test environments",
    TEST_PLAN = "test plan",
    TEST_TYPE = "test type",
}

interface Parameters {
    field: JiraField;
}

export class ExtractFieldIdCommand extends Command<string, Parameters> {
    private readonly allFields: Computable<FieldDetail[]>;
    constructor(parameters: Parameters, allFields: Computable<FieldDetail[]>) {
        super(parameters);
        this.allFields = allFields;
    }

    protected async computeResult(): Promise<string> {
        const jiraFields = await this.allFields.compute();
        // Lowercase everything to work around case sensitivities.
        // Jira sometimes returns field names capitalized, sometimes it doesn't (?).
        const lowerCasedName = this.parameters.field.toLowerCase();
        const matches = jiraFields.filter((field: FieldDetail) => {
            return field.name.toLowerCase() === lowerCasedName;
        });
        if (matches.length > 1) {
            const nameDuplicates = prettyPadObjects(matches)
                .map((duplicate) =>
                    Object.entries(duplicate)
                        .map((entry) => `${entry[0]}: ${entry[1]}`)
                        .join(", ")
                )
                .sort()
                .join("\n");
            const idSuggestions = matches.map((field: FieldDetail) => `"${field.id}"`).join(" or ");
            throw new Error(
                dedent(`
                    Failed to fetch Jira field ID for field with name: ${this.parameters.field}
                    There are multiple fields with this name

                    Duplicates:
                      ${nameDuplicates}

                    You can provide field IDs in the options:

                      jira: {
                        fields: {
                          ${getOptionName(this.parameters.field)}: // ${idSuggestions}
                        }
                      }
                `)
            );
        }
        if (matches.length === 0) {
            const fieldNames: StringMap<string> = {};
            jiraFields.forEach((field: FieldDetail) => {
                fieldNames[field.id] = field.name;
            });
            if (Object.keys(fieldNames).length === 0) {
                throw new Error(
                    dedent(`
                        Failed to fetch Jira field ID for field with name: ${this.parameters.field}
                        Make sure the field actually exists and that your Jira language settings did not modify the field's name

                        You can provide field IDs directly without relying on language settings:

                          jira: {
                            fields: {
                              ${getOptionName(this.parameters.field)}: // corresponding field ID
                            }
                          }
                    `)
                );
            } else {
                const availableFields = Object.entries(prettyPadValues(fieldNames))
                    .map((entry) => `name: ${entry[1]} id: ${JSON.stringify(entry[0])}`)
                    .sort();
                throw new Error(
                    dedent(`
                        Failed to fetch Jira field ID for field with name: ${this.parameters.field}
                        Make sure the field actually exists and that your Jira language settings did not modify the field's name

                        Available fields:
                          ${availableFields.join("\n")}

                        You can provide field IDs directly without relying on language settings:

                          jira: {
                            fields: {
                              ${getOptionName(this.parameters.field)}: // corresponding field ID
                            }
                          }
                    `)
                );
            }
        }
        return matches[0].id;
    }
}

function getOptionName(fieldName: JiraField): keyof JiraFieldIds {
    switch (fieldName) {
        case JiraField.DESCRIPTION:
            return "description";
        case JiraField.SUMMARY:
            return "summary";
        case JiraField.LABELS:
            return "labels";
        case JiraField.TEST_ENVIRONMENTS:
            return "testEnvironments";
        case JiraField.TEST_PLAN:
            return "testPlan";
        case JiraField.TEST_TYPE:
            return "testType";
    }
}
