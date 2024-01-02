import { JiraClient } from "../../../../client/jira/jira-client";
import { Attachment } from "../../../../types/jira/responses/attachment";
import { LOG, Level } from "../../../../util/logging";
import { Command, Computable, SkippedError } from "../../../command";

export class AttachFilesCommand extends Command<Attachment[]> {
    private readonly jiraClient: JiraClient;
    private readonly files: Computable<string[]>;
    private readonly resolvedExecutionIssueKey: Computable<string>;
    constructor(
        jiraClient: JiraClient,
        files: Computable<string[]>,
        resolvedExecutionIssueKey: Computable<string>
    ) {
        super();
        this.jiraClient = jiraClient;
        this.files = files;
        this.resolvedExecutionIssueKey = resolvedExecutionIssueKey;
    }

    protected async computeResult(): Promise<Attachment[]> {
        const resolvedExecutionIssueKey = await this.resolvedExecutionIssueKey.compute();
        const files = await this.files.compute();
        if (files.length === 0) {
            throw new SkippedError(
                `Skipping attaching files to test execution issue ${resolvedExecutionIssueKey}: No files to attach`
            );
        }
        LOG.message(
            Level.INFO,
            `Attaching files to test execution issue ${resolvedExecutionIssueKey}`
        );
        return await this.jiraClient.addAttachment(resolvedExecutionIssueKey, ...files);
    }
}
