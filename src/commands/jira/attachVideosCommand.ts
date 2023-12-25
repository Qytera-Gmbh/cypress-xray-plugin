import { JiraClient } from "../../client/jira/jiraClient";
import { Attachment } from "../../types/jira/responses/attachment";
import { Command, Computable } from "../../util/command/command";

export class AttachVideosCommand extends Command<Attachment[]> {
    constructor(
        private readonly jiraClient: JiraClient,
        private readonly files: Computable<string[]>,
        private readonly issueKey: Computable<string>
    ) {
        super();
        this.jiraClient = jiraClient;
        this.issueKey = issueKey;
        this.files = files;
    }

    protected async computeResult(): Promise<Attachment[]> {
        const executionIssueKey = await this.issueKey.getResult();
        const files = await this.files.getResult();
        return await this.jiraClient.addAttachment(executionIssueKey, ...files);
    }
}
