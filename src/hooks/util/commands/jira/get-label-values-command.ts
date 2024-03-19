import { Issue } from "../../../../types/jira/responses/issue";
import { StringMap } from "../../../../types/util";
import { extractArrayOfStrings } from "../../../../util/extraction";
import { JiraField } from "./extract-field-id-command";
import { GetFieldValuesCommand } from "./get-field-values-command";

export class GetLabelValuesCommand extends GetFieldValuesCommand<JiraField.LABELS> {
    protected async computeResult(): Promise<StringMap<string[]>> {
        // Field property example:
        // labels: ["regression", "quality"]
        return await this.extractJiraFieldValues((issue: Issue, fieldId: string) =>
            extractArrayOfStrings(issue.fields, fieldId)
        );
    }
}
