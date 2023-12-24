import { IJiraClient } from "../../../client/jira/jiraClient";
import { IIssue } from "../../../types/jira/responses/issue";
import { StringMap } from "../../../types/util";
import { Computable } from "../../../util/command/command";
import { extractString } from "../../../util/extraction";
import { GetFieldValuesCommand } from "./getFieldValuesCommand";

export class GetDescriptionValuesCommand extends GetFieldValuesCommand<string> {
    constructor(
        fieldId: Computable<string>,
        issueKeys: Computable<string[]>,
        private readonly jiraClient: IJiraClient
    ) {
        super(fieldId, issueKeys);
        this.jiraClient = jiraClient;
    }

    protected async computeResult(): Promise<StringMap<string>> {
        // Field property example:
        // description: "This is a description"
        return await super.extractJiraFieldValues(
            this.jiraClient,
            (issue: IIssue, fieldId: string) => extractString(issue.fields, fieldId)
        );
    }
}
