import { JiraClient } from "../../client/jira/jiraClient";
import { IssueTypeDetails } from "../../types/jira/responses/issueTypeDetails";
import { Command } from "../command";

export class FetchIssueTypes extends Command<IssueTypeDetails[]> {
    private readonly jiraClient: JiraClient;
    constructor(jiraClient: JiraClient) {
        super();
        this.jiraClient = jiraClient;
    }

    protected async computeResult(): Promise<IssueTypeDetails[]> {
        return await this.jiraClient.getIssueTypes();
    }
}
