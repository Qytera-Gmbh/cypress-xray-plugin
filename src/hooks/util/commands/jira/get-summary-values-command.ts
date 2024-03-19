import { Issue } from "../../../../types/jira/responses/issue";
import { StringMap } from "../../../../types/util";
import { extractString } from "../../../../util/extraction";
import { JiraField } from "./extract-field-id-command";
import { GetFieldValuesCommand } from "./get-field-values-command";

export class GetSummaryValuesCommand extends GetFieldValuesCommand<JiraField.SUMMARY> {
    protected async computeResult(): Promise<StringMap<string>> {
        // Field property example:
        // summary: "Bug 12345"
        return await super.extractJiraFieldValues((issue: Issue, fieldId: string) =>
            extractString(issue.fields, fieldId)
        );
    }
}
