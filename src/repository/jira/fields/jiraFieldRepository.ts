import { JiraClientCloud } from "../../../client/jira/jiraClientCloud";
import { JiraClientServer } from "../../../client/jira/jiraClientServer";
import { Options } from "../../../types/plugin";
import { StringMap, dedent } from "../../../types/util";

export class JiraFieldRepository {
    protected readonly jiraClient: JiraClientServer | JiraClientCloud;
    protected readonly options: Options;

    private readonly fieldIds: StringMap<string> = {};

    constructor(jiraClient: JiraClientServer | JiraClientCloud, options: Options) {
        this.jiraClient = jiraClient;
        this.options = options;
    }

    public async getFieldId(fieldName: string): Promise<string> {
        // Lowercase everything to work around case sensitivities.
        // Jira sometimes returns field names capitalized, sometimes it doesn't (?).
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
                            Failed to fetch Jira field ID for field with name: ${fieldName}
                            Make sure to check if your Jira language settings modified the field's name

                            Available fields:
                              ${jiraFields
                                  .map((field) => `name: ${field.name}, id: ${field.id}`)
                                  .join("\n")}

                            You can provide field translations in the options:

                              jira.fields = {
                                "${fieldName}": {
                                  name: // translation of ${fieldName}
                                }
                              }
                        `)
                    );
                } else if (matches.length > 1) {
                    throw new Error(
                        dedent(`
                            Failed to fetch Jira field ID for field with name: ${fieldName}
                            There are multiple fields with this name

                            Duplicates:
                              ${matches
                                  .map((field) =>
                                      Object.entries(field)
                                          .map(([key, value]) => `${key}: ${value}`)
                                          .join(", ")
                                  )
                                  .join("\n")}

                            Make sure to set option jira.fields["${fieldName}"] to the correct ID:

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
}
