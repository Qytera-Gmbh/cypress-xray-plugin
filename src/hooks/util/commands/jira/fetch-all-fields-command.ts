import { JiraClient } from "../../../../client/jira/jira-client";
import { FieldDetail } from "../../../../types/jira/responses/field-detail";
import { Command, CommandDescription } from "../../../command";

interface Parameters {
    jiraClient: JiraClient;
}

export class FetchAllFieldsCommand extends Command<FieldDetail[], Parameters> {
    public getDescription(): CommandDescription {
        return {
            description: "Retrieves all fields available in the Jira instance.",
            runtimeInputs: [],
        };
    }

    protected async computeResult(): Promise<FieldDetail[]> {
        return await this.parameters.jiraClient.getFields();
    }
}
