import { Issue } from "../../../../types/jira/responses/issue";
import { StringMap } from "../../../../types/util";
import { extractArrayOfStrings } from "../../../../util/extraction";
import { CommandDescription } from "../../../command";
import { JiraField } from "./extract-field-id-command";
import { GetFieldValuesCommand } from "./get-field-values-command";

export class GetLabelValuesCommand extends GetFieldValuesCommand<JiraField.LABELS> {
    public getDescription(): CommandDescription {
        return {
            description: "Retrieves label field values of provided Jira issues.",
            runtimeInputs: ["the ID of the label field", "the issue keys whose labels to retrieve"],
        };
    }

    protected async computeResult(): Promise<StringMap<string[]>> {
        // Field property example:
        // labels: ["regression", "quality"]
        return await this.extractJiraFieldValues((issue: Issue, fieldId: string) =>
            extractArrayOfStrings(issue.fields, fieldId)
        );
    }
}
