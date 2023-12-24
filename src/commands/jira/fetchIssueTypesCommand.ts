import { JiraClient } from "../../client/jira/jiraClient";
import { IssueTypeDetails } from "../../types/jira/responses/issueTypeDetails";
import { Command } from "../../util/command/command";

export class FetchIssueTypes extends Command<IssueTypeDetails[]> {
    constructor(private readonly jiraClient: JiraClient) {
        super();
        this.jiraClient = jiraClient;
    }

    protected async computeResult(): Promise<IssueTypeDetails[]> {
        return await this.jiraClient.getIssueTypes();
    }
}
