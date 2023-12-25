import { SupportedField } from "../../../repository/jira/fields/jiraIssueFetcher";
import { Issue } from "../../../types/jira/responses/issue";
import { StringMap } from "../../../types/util";
import { extractArrayOfStrings } from "../../../util/extraction";
import { GetFieldValuesCommand } from "./getFieldValuesCommand";

export class GetLabelValuesCommand extends GetFieldValuesCommand<SupportedField.LABELS> {
    protected async computeResult(): Promise<StringMap<string[]>> {
        // Field property example:
        // labels: ["regression", "quality"]
        return await this.extractJiraFieldValues((issue: Issue, fieldId: string) =>
            extractArrayOfStrings(issue.fields, fieldId)
        );
    }
}
