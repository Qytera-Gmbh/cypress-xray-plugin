import { IJiraClient } from "../../../client/jira/jiraClient";
import { FieldDetailCloud, FieldDetailServer } from "../../../types/jira/responses/fieldDetail";
import { InternalJiraOptions } from "../../../types/plugin";
import { StringMap } from "../../../types/util";

export class JiraFieldRepository {
    protected readonly jiraClient: IJiraClient;
    protected readonly jiraOptions: InternalJiraOptions;

    private readonly names: StringMap<string> = {};
    private readonly ids: StringMap<string> = {};

    constructor(jiraClient: IJiraClient, jiraOptions: InternalJiraOptions) {
        this.jiraClient = jiraClient;
        this.jiraOptions = jiraOptions;
    }

    public async getFieldId(
        fieldName: string,
        callbacks?: {
            onFetchError?: () => void;
            onMultipleFieldsError?: (duplicates: FieldDetailServer[] | FieldDetailCloud[]) => void;
            onMissingFieldError?: (availableFields: string[]) => void;
        }
    ): Promise<string | undefined> {
        // Lowercase everything to work around case sensitivities.
        // Jira sometimes returns field names capitalized, sometimes it doesn't (?).
        const lowerCasedName = fieldName.toLowerCase();
        if (!(lowerCasedName in this.ids)) {
            const jiraFields = await this.jiraClient.getFields();
            if (!jiraFields) {
                if (callbacks?.onFetchError) {
                    callbacks.onFetchError();
                }
            } else {
                const matches = jiraFields.filter((field) => {
                    const lowerCasedField = field.name.toLowerCase();
                    return lowerCasedField === lowerCasedName;
                });
                if (matches.length > 1) {
                    if (callbacks?.onMultipleFieldsError) {
                        callbacks.onMultipleFieldsError(matches);
                    }
                    return undefined;
                }
                jiraFields.forEach((jiraField) => {
                    this.ids[jiraField.name.toLowerCase()] = jiraField.id;
                    this.names[jiraField.name.toLowerCase()] = jiraField.name;
                });
            }
        }
        if (!(lowerCasedName in this.ids)) {
            const availableFields = Object.entries(this.ids).map(
                ([name, id]) => `name: ${this.names[name]}, id: ${id}`
            );
            if (callbacks?.onMissingFieldError) {
                callbacks.onMissingFieldError(availableFields);
            }
            return undefined;
        }
        return this.ids[lowerCasedName];
    }
}
