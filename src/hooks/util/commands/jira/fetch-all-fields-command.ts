import { JiraClient } from "../../../../client/jira/jira-client";
import { FieldDetail } from "../../../../types/jira/responses/field-detail";
import { Command } from "../../../command";

export class FetchAllFieldsCommand extends Command<FieldDetail[]> {
    private readonly jiraClient: JiraClient;
    constructor(jiraClient: JiraClient) {
        super();
        this.jiraClient = jiraClient;
    }

    protected async computeResult(): Promise<FieldDetail[]> {
        return await this.jiraClient.getFields();
    }
}
