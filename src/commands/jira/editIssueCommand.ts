import { JiraClient } from "../../client/jira/jiraClient";
import { IssueUpdate } from "../../types/jira/responses/issueUpdate";
import { Command, Computable } from "../../util/command/command";

export class EditissueCommand extends Command<string> {
    constructor(
        private readonly jiraClient: JiraClient,
        private readonly issueKey: Computable<string>,
        private readonly fields: Computable<IssueUpdate["fields"]>
    ) {
        super();
        this.jiraClient = jiraClient;
        this.issueKey = issueKey;
        this.fields = fields;
    }

    protected async computeResult(): Promise<string> {
        const issueKey = await this.issueKey.getResult();
        const fields = await this.fields.getResult();
        return await this.jiraClient.editIssue(issueKey, { fields: fields });
    }
}
