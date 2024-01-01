import { FieldDetail } from "../../../../types/jira/responses/fieldDetail";
import { StringMap } from "../../../../types/util";
import { missingFieldsError, multipleFieldsError } from "../../../../util/errors";
import { Command, Computable } from "../../../command";

export enum JiraField {
    DESCRIPTION = "description",
    SUMMARY = "summary",
    LABELS = "labels",
    TEST_ENVIRONMENTS = "test environments",
    TEST_PLAN = "test plan",
    TEST_TYPE = "test type",
}

export class ExtractFieldIdCommand extends Command<string> {
    private readonly field: JiraField;
    private readonly allFields: Computable<FieldDetail[]>;
    constructor(field: JiraField, allFields: Computable<FieldDetail[]>) {
        super();
        this.field = field;
        this.allFields = allFields;
    }

    public getField(): JiraField {
        return this.field;
    }

    protected async computeResult(): Promise<string> {
        const jiraFields = await this.allFields.compute();
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
