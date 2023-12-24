import { IJiraClient } from "../../../client/jira/jiraClient";
import { IIssue } from "../../../types/jira/responses/issue";
import { StringMap } from "../../../types/util";
import { Computable } from "../../../util/command/command";
import { extractArrayOfStrings } from "../../../util/extraction";
import { GetFieldValuesCommand } from "./getFieldValuesCommand";

export class GetLabelValuesCommand extends GetFieldValuesCommand<string[]> {
    constructor(
        fieldId: Computable<string>,
        issueKeys: Computable<string[]>,
        private readonly jiraClient: IJiraClient
    ) {
        super(fieldId, issueKeys);
        this.jiraClient = jiraClient;
    }

    protected async computeResult(): Promise<StringMap<string[]>> {
        // Field property example:
        // labels: ["regression", "quality"]
        return await this.extractJiraFieldValues(
            this.jiraClient,
            (issue: IIssue, fieldId: string) => extractArrayOfStrings(issue.fields, fieldId)
        );
    }
}
