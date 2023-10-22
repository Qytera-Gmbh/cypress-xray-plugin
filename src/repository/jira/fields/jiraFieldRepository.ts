import { IJiraClient } from "../../../client/jira/jiraClient";
import { IFieldDetail } from "../../../types/jira/responses/fieldDetail";
import { InternalJiraOptions, JiraFieldIds } from "../../../types/plugin";
import { StringMap } from "../../../types/util";
import { dedent } from "../../../util/dedent";
import { prettyPadObjects, prettyPadValues } from "../../../util/pretty";
import { SupportedFields } from "./jiraIssueFetcher";

export interface IJiraFieldRepository {
    getFieldId(fieldName: string): Promise<string>;
}

export class JiraFieldRepository implements IJiraFieldRepository {
    protected readonly jiraClient: IJiraClient;
    protected readonly jiraOptions: InternalJiraOptions;

    private readonly names: StringMap<string> = {};
    private readonly ids: StringMap<string> = {};

    constructor(jiraClient: IJiraClient, jiraOptions: InternalJiraOptions) {
        this.jiraClient = jiraClient;
        this.jiraOptions = jiraOptions;
    }

    public async getFieldId(fieldName: SupportedFields): Promise<string> {
        // Lowercase everything to work around case sensitivities.
        // Jira sometimes returns field names capitalized, sometimes it doesn't (?).
        const lowerCasedName = fieldName.toLowerCase();
        if (!(lowerCasedName in this.ids)) {
            const jiraFields = await this.jiraClient.getFields();
            if (!jiraFields) {
                throw new Error(`Failed to fetch Jira field ID for field with name: ${fieldName}`);
            } else {
                const matches = jiraFields.filter((field) => {
                    const lowerCasedField = field.name.toLowerCase();
                    return lowerCasedField === lowerCasedName;
                });
                if (matches.length > 1) {
                    throw this.multipleFieldsError(fieldName, matches);
                }
                jiraFields.forEach((jiraField) => {
                    this.ids[jiraField.name.toLowerCase()] = jiraField.id;
                    this.names[jiraField.name.toLowerCase()] = jiraField.name;
                });
            }
        }
        if (!(lowerCasedName in this.ids)) {
            throw this.missingFieldsError(fieldName);
        }
        return this.ids[lowerCasedName];
    }

    private multipleFieldsError(fieldName: SupportedFields, matches: IFieldDetail[]): Error {
        const nameDuplicates = prettyPadObjects(matches)
            .map((duplicate) =>
                Object.entries(duplicate)
                    .map((entry) => `${entry[0]}: ${entry[1]}`)
                    .join(", ")
            )
            .sort()
            .join("\n");
        const idSuggestions = matches.map((field: IFieldDetail) => `"${field.id}"`).join(" or ");
        return new Error(
            dedent(`
                Failed to fetch Jira field ID for field with name: ${fieldName}
                There are multiple fields with this name

                Duplicates:
                  ${nameDuplicates}

                You can provide field IDs in the options:

                  jira: {
                    fields: {
                      ${this.getOptionName(fieldName)}: // ${idSuggestions}
                    }
                  }
            `)
        );
    }

    private missingFieldsError(fieldName: SupportedFields): Error {
        if (Object.keys(this.ids).length === 0) {
            throw new Error(
                dedent(`
                    Failed to fetch Jira field ID for field with name: ${fieldName}
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields: {
                          ${this.getOptionName(fieldName)}: // corresponding field ID
                        }
                      }
                `)
            );
        } else {
            const availableFields = Object.entries(prettyPadValues(this.names))
                .map((entry) => `name: ${entry[1]} id: ${JSON.stringify(entry[0])}`)
                .sort();
            throw new Error(
                dedent(`
                    Failed to fetch Jira field ID for field with name: ${fieldName}
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    Available fields:
                      ${availableFields.join("\n")}

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields: {
                          ${this.getOptionName(fieldName)}: // corresponding field ID
                        }
                      }
                `)
            );
        }
    }

    private getOptionName(fieldName: SupportedFields): keyof JiraFieldIds {
        switch (fieldName) {
            case SupportedFields.DESCRIPTION:
                return "description";
            case SupportedFields.SUMMARY:
                return "summary";
            case SupportedFields.LABELS:
                return "labels";
            case SupportedFields.TEST_ENVIRONMENTS:
                return "testEnvironments";
            case SupportedFields.TEST_PLAN:
                return "testPlan";
            case SupportedFields.TEST_TYPE:
                return "testType";
        }
    }
}
