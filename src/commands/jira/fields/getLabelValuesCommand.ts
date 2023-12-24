import { JiraClient } from "../../../client/jira/jiraClient";
import { Issue } from "../../../types/jira/responses/issue";
import { StringMap } from "../../../types/util";
import { Computable } from "../../../util/command/command";
import { extractArrayOfStrings } from "../../../util/extraction";
import { GetFieldValuesCommand } from "./getFieldValuesCommand";

export class GetLabelValuesCommand extends GetFieldValuesCommand<string[]> {
    constructor(
        fieldId: Computable<string>,
        issueKeys: Computable<string[]>,
        private readonly jiraClient: JiraClient
    ) {
        super(fieldId, issueKeys);
        this.jiraClient = jiraClient;
    }

    protected async computeResult(): Promise<StringMap<string[]>> {
        // Field property example:
        // labels: ["regression", "quality"]
        return await this.extractJiraFieldValues(this.jiraClient, (issue: Issue, fieldId: string) =>
            extractArrayOfStrings(issue.fields, fieldId)
        );
    }
}
