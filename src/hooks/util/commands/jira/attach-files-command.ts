import { JiraClient } from "../../../../client/jira/jira-client";
import { Attachment } from "../../../../types/jira/responses/attachment";
import { LOG, Level } from "../../../../util/logging";
import { Command, Computable, SkippedError } from "../../../command";

interface Parameters {
    jiraClient: JiraClient;
}

export class AttachFilesCommand extends Command<Attachment[], Parameters> {
    private readonly files: Computable<string[]>;
    private readonly resolvedExecutionIssueKey: Computable<string>;
    constructor(
        parameters: Parameters,
        files: Computable<string[]>,
        resolvedExecutionIssueKey: Computable<string>
    ) {
        super(parameters);
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
        return await this.parameters.jiraClient.addAttachment(resolvedExecutionIssueKey, ...files);
    }
}
