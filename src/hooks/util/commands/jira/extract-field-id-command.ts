import { FieldDetail } from "../../../../types/jira/responses/field-detail";
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
            throw multipleFieldsError(this.parameters.field, matches);
        }
        if (matches.length === 0) {
            const fieldNames: StringMap<string> = {};
            jiraFields.forEach((field: FieldDetail) => {
                fieldNames[field.id] = field.name;
            });
            throw missingFieldsError(this.parameters.field, fieldNames);
        }
        return matches[0].id;
    }
}
