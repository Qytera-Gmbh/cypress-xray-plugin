import { JiraClient } from "../../../client/jira/jiraClient";
import { FieldDetail } from "../../../types/jira/responses/fieldDetail";
import { StringMap } from "../../../types/util";
import { missingFieldsError, multipleFieldsError } from "../../../util/errors";
import { SupportedField } from "./jiraIssueFetcher";

/**
 * An interface describing a Jira field repository, which provides methods for retrieving arbitrary
 * field IDs from Jira.
 */
export interface JiraFieldRepository {
    /**
     * Returns the Jira field ID for the field with the provided name.
     *
     * @param fieldName - the field name
     * @returns the field's Jira ID
     * @throws if the field does not exist or if there are multiple fields with the given name
     */
    getFieldId(fieldName: SupportedField): Promise<string>;
}

/**
 * A Jira field repository which caches retrieved field IDs. After the first ID retrieval, all
 * subsequent accesses will return the cached value.
 */
export class CachingJiraFieldRepository implements JiraFieldRepository {
    private readonly jiraClient: JiraClient;
    private readonly names: StringMap<string> = {};
    private readonly ids: StringMap<string> = {};

    /**
     * Constructs a new caching Jira field repository. The Jira client is necessary for accessing
     * Jira data.
     *
     * @param jiraClient - the Jira client
     */
    constructor(jiraClient: JiraClient) {
        this.jiraClient = jiraClient;
    }

    public async getFieldId(fieldName: SupportedField): Promise<string> {
        // Lowercase everything to work around case sensitivities.
        // Jira sometimes returns field names capitalized, sometimes it doesn't (?).
        const lowerCasedName = fieldName.toLowerCase();
        if (!(lowerCasedName in this.ids)) {
            const jiraFields = await this.jiraClient.getFields();
            const matches = jiraFields.filter((field: FieldDetail) => {
                const lowerCasedField = field.name.toLowerCase();
                return lowerCasedField === lowerCasedName;
            });
            if (matches.length > 1) {
                throw multipleFieldsError(fieldName, matches);
            }
            jiraFields.forEach((jiraField) => {
                this.ids[jiraField.name.toLowerCase()] = jiraField.id;
                this.names[jiraField.id] = jiraField.name;
            });
        }
        if (!(lowerCasedName in this.ids)) {
            throw missingFieldsError(fieldName, this.names);
        }
        return this.ids[lowerCasedName];
    }
}
