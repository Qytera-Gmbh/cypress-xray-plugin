import { IJiraClient } from "../../client/jira/jiraClient";
import { IAttachment } from "../../types/jira/responses/attachment";
import { Command, Computable } from "../../util/command/command";

export class AttachVideosCommand extends Command<IAttachment[]> {
    constructor(
        private readonly jiraClient: IJiraClient,
        private readonly files: string[],
        private readonly issueKey: Computable<string>
    ) {
        super();
        this.jiraClient = jiraClient;
        this.issueKey = issueKey;
        this.files = files;
    }

    protected async computeResult(): Promise<IAttachment[]> {
        const executionIssueKey = await this.issueKey.getResult();
        return await this.jiraClient.addAttachment(executionIssueKey, ...this.files);
    }
}
