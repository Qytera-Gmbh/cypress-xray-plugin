import { JiraClient } from "../../../../client/jira/jira-client";
import { IssueTypeDetails } from "../../../../types/jira/responses/issue-type-details";
import { Command, CommandDescription } from "../../../command";

interface Parameters {
    jiraClient: JiraClient;
}

export class FetchIssueTypesCommand extends Command<IssueTypeDetails[], Parameters> {
    public getDescription(): CommandDescription {
        return {
            description: "Retrieves all issue types available in the Jira instance.",
            runtimeInputs: [],
        };
    }

    protected async computeResult(): Promise<IssueTypeDetails[]> {
        return await this.parameters.jiraClient.getIssueTypes();
    }
}
