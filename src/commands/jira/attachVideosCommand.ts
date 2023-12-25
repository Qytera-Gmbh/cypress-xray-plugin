import { JiraClient } from "../../client/jira/jiraClient";
import { Attachment } from "../../types/jira/responses/attachment";
import { Command, Computable } from "../command";

export class AttachVideosCommand extends Command<Attachment[]> {
    private readonly jiraClient: JiraClient;
    private readonly files: Computable<string[]>;
    private readonly issueKey: Computable<string>;
    constructor(jiraClient: JiraClient, files: Computable<string[]>, issueKey: Computable<string>) {
        super();
        this.jiraClient = jiraClient;
        this.files = files;
        this.issueKey = issueKey;
    }

    protected async computeResult(): Promise<Attachment[]> {
        const executionIssueKey = await this.issueKey.compute();
        const files = await this.files.compute();
        return await this.jiraClient.addAttachment(executionIssueKey, ...files);
    }
}
