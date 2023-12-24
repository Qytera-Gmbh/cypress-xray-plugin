import { SupportedField } from "../../../repository/jira/fields/jiraIssueFetcher";
import { FieldDetail } from "../../../types/jira/responses/fieldDetail";
import { StringMap } from "../../../types/util";
import { Command, Computable } from "../../../util/command/command";
import { missingFieldsError, multipleFieldsError } from "../../../util/errors";

export class ExtractFieldIdCommand extends Command<string> {
    constructor(
        private readonly allFields: Computable<FieldDetail[]>,
        private readonly field: SupportedField
    ) {
        super();
        this.allFields = allFields;
        this.field = field;
    }

    public getField(): SupportedField {
        return this.field;
    }

    protected async computeResult(): Promise<string> {
        const jiraFields = await this.allFields.getResult();
        // Lowercase everything to work around case sensitivities.
        // Jira sometimes returns field names capitalized, sometimes it doesn't (?).
        const lowerCasedName = this.field.toLowerCase();
        const matches = jiraFields.filter((field: FieldDetail) => {
            return field.name.toLowerCase() === lowerCasedName;
        });
        if (matches.length > 1) {
            throw multipleFieldsError(this.field, matches);
        }
        if (matches.length === 0) {
            const fieldNames: StringMap<string> = {};
            jiraFields.forEach((field: FieldDetail) => {
                fieldNames[field.id] = field.name;
            });
            throw missingFieldsError(this.field, fieldNames);
        }
        return matches[0].id;
    }
}
