import { JiraClient } from "../../../../client/jira/jira-client";
import { IssueTypeDetails } from "../../../../types/jira/responses/issue-type-details";
import { Command } from "../../../command";

export class FetchIssueDetailsCommand extends Command<IssueTypeDetails[]> {
    private readonly jiraClient: JiraClient;
    constructor(jiraClient: JiraClient) {
        super();
        this.jiraClient = jiraClient;
    }

    protected async computeResult(): Promise<IssueTypeDetails[]> {
        return await this.jiraClient.getIssueTypes();
    }
}
