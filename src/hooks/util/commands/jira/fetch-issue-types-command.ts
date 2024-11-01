import type { JiraClient } from "../../../../client/jira/jira-client.js";
import type { IssueTypeDetails } from "../../../../types/jira/responses/issue-type-details.js";
import { Command } from "../../../command.js";

interface Parameters {
    jiraClient: JiraClient;
}

export class FetchIssueTypesCommand extends Command<IssueTypeDetails[], Parameters> {
    protected async computeResult(): Promise<IssueTypeDetails[]> {
        return await this.parameters.jiraClient.getIssueTypes();
    }
}
