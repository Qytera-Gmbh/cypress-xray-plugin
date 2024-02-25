import { JiraClient } from "../../../../client/jira/jira-client";
import { IssueTypeDetails } from "../../../../types/jira/responses/issue-type-details";
import { Command } from "../../../command";

interface Parameters {
    jiraClient: JiraClient;
}

export class FetchIssueTypesCommand extends Command<IssueTypeDetails[], Parameters> {
    protected async computeResult(): Promise<IssueTypeDetails[]> {
        return await this.parameters.jiraClient.getIssueTypes();
    }
}
