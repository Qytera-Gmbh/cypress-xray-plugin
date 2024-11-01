import type { JiraClient } from "../../../../client/jira/jira-client.js";
import type { FieldDetail } from "../../../../types/jira/responses/field-detail.js";
import { Command } from "../../../command.js";

interface Parameters {
    jiraClient: JiraClient;
}

export class FetchAllFieldsCommand extends Command<FieldDetail[], Parameters> {
    protected async computeResult(): Promise<FieldDetail[]> {
        return await this.parameters.jiraClient.getFields();
    }
}
