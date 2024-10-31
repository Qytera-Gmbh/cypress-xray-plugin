import { JiraClient } from "../../../../client/jira/jira-client";
import { IssueTransition } from "../../../../types/jira/responses/issue-transition";
import { Level, Logger } from "../../../../util/logging";
import { Command, Computable } from "../../../command";

interface Parameters {
    jiraClient: JiraClient;
    transition: IssueTransition;
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
        await this.parameters.jiraClient.transitionIssue(resolvedExecutionIssueKey, {
            transition: this.parameters.transition,
        });
    }
}
