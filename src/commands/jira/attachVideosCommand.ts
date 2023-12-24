import { IJiraClient } from "../../client/jira/jiraClient";
import { IAttachment } from "../../types/jira/responses/attachment";
import { Command } from "../../util/command/command";

export class AttachVideosCommand extends Command<IAttachment[]> {
    constructor(
        private readonly jiraClient: IJiraClient,
        private readonly files: string[],
        private readonly issueKeyCommand: Command<string>
    ) {
        super();
        this.jiraClient = jiraClient;
        this.issueKeyCommand = issueKeyCommand;
        this.files = files;
    }

    protected async computeResult(): Promise<IAttachment[]> {
        const executionIssueKey = await this.issueKeyCommand.getResult();
        return await this.jiraClient.addAttachment(executionIssueKey, ...this.files);
    }
}
