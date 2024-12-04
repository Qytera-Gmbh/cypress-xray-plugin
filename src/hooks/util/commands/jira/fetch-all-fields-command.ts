import type { JiraClient } from "../../../../client/jira/jira-client";
import type { FieldDetail } from "../../../../types/jira/responses/field-detail";
import { Command } from "../../../command";

interface Parameters {
    jiraClient: JiraClient;
}

export class FetchAllFieldsCommand extends Command<FieldDetail[], Parameters> {
    protected async computeResult(): Promise<FieldDetail[]> {
        return await this.parameters.jiraClient.getFields();
    }
}
