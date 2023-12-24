import { IJiraClient } from "../../client/jira/jiraClient";
import { IIssueTypeDetails } from "../../types/jira/responses/issueTypeDetails";
import { Command } from "../../util/command/command";

export class FetchIssueTypes extends Command<IIssueTypeDetails[]> {
    constructor(private readonly jiraClient: IJiraClient) {
        super();
        this.jiraClient = jiraClient;
    }

    protected async computeResult(): Promise<IIssueTypeDetails[]> {
        return await this.jiraClient.getIssueTypes();
    }
}
