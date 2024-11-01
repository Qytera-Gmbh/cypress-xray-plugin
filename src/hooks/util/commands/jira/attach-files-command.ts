import type { JiraClient } from "../../../../client/jira/jira-client.js";
import type { Attachment } from "../../../../types/jira/responses/attachment.js";
import type { Logger } from "../../../../util/logging.js";
import { Level } from "../../../../util/logging.js";
import type { Computable } from "../../../command.js";
import { Command } from "../../../command.js";

interface Parameters {
    jiraClient: JiraClient;
}

export class AttachFilesCommand extends Command<Attachment[], Parameters> {
    private readonly files: Computable<string[]>;
    private readonly resolvedExecutionIssueKey: Computable<string>;
    constructor(
        parameters: Parameters,
        logger: Logger,
        files: Computable<string[]>,
        resolvedExecutionIssueKey: Computable<string>
    ) {
        super(parameters, logger);
        this.files = files;
        this.resolvedExecutionIssueKey = resolvedExecutionIssueKey;
    }

    protected async computeResult(): Promise<Attachment[]> {
        const resolvedExecutionIssueKey = await this.resolvedExecutionIssueKey.compute();
        const files = await this.files.compute();
        if (files.length === 0) {
            return [];
        }
        this.logger.message(
            Level.INFO,
            `Attaching files to test execution issue ${resolvedExecutionIssueKey}`
        );
        return await this.parameters.jiraClient.addAttachment(resolvedExecutionIssueKey, ...files);
    }
}
