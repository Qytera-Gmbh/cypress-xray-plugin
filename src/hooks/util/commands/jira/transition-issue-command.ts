import type { JiraClient } from "../../../../client/jira/jira-client";
import type { IssueUpdate } from "../../../../types/jira/responses/issue-update";
import type { Logger } from "../../../../util/logging";
import { Level } from "../../../../util/logging";
import type { Computable } from "../../../command";
import { Command } from "../../../command";

interface Parameters {
    jiraClient: JiraClient;
    transition: Exclude<IssueUpdate["transition"], undefined>;
}

export class TransitionIssueCommand extends Command<void, Parameters> {
    private readonly resolvedExecutionIssueKey: Computable<string>;
    constructor(
        parameters: Parameters,
        logger: Logger,
        resolvedExecutionIssueKey: Computable<string>
    ) {
        super(parameters, logger);
        this.resolvedExecutionIssueKey = resolvedExecutionIssueKey;
    }

    protected async computeResult(): Promise<void> {
        const resolvedExecutionIssueKey = await this.resolvedExecutionIssueKey.compute();
        this.logger.message(
            Level.INFO,
            `Transitioning test execution issue ${resolvedExecutionIssueKey}`
        );
        await this.parameters.jiraClient.transitionIssue(
            resolvedExecutionIssueKey,
            this.parameters.transition
        );
    }
}
