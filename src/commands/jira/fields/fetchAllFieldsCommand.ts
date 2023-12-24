import { IJiraClient } from "../../../client/jira/jiraClient";
import { IFieldDetail } from "../../../types/jira/responses/fieldDetail";
import { Command } from "../../../util/command/command";

export class FetchAllFieldsCommand extends Command<IFieldDetail[]> {
    constructor(private readonly jiraClient: IJiraClient) {
        super();
        this.jiraClient = jiraClient;
    }

    protected async computeResult(): Promise<IFieldDetail[]> {
        return await this.jiraClient.getFields();
    }
}
