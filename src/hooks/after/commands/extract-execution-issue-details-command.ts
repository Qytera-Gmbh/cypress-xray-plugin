import { IssueTypeDetails } from "../../../types/jira/responses/issue-type-details";
import { InternalJiraOptions } from "../../../types/plugin";
import { dedent } from "../../../util/dedent";
import { HELP } from "../../../util/help";
import { Command, Computable } from "../../command";

type Parameters = Pick<InternalJiraOptions, "projectKey" | "testExecutionIssueType">;

export class ExtractExecutionIssueDetailsCommand extends Command<IssueTypeDetails> {
    private readonly parameters: Parameters;
    private readonly allIssueDetails: Computable<IssueTypeDetails[]>;

    constructor(parameters: Parameters, allIssueDetails: Computable<IssueTypeDetails[]>) {
        super();
        this.parameters = parameters;
        this.allIssueDetails = allIssueDetails;
    }

    protected async computeResult(): Promise<IssueTypeDetails> {
        const allIssueDetails = await this.allIssueDetails.compute();
        const executionIssueDetails = allIssueDetails.filter(
            (details: IssueTypeDetails) => details.name === this.parameters.testExecutionIssueType
        );
        if (executionIssueDetails.length === 0) {
            throw new Error(
                dedent(`
                    Failed to retrieve issue type information for issue type: ${this.parameters.testExecutionIssueType}

                    Make sure you have Xray installed.

                    For more information, visit:
                    - ${HELP.plugin.configuration.jira.testExecutionIssueType}
                    - ${HELP.plugin.configuration.jira.testPlanIssueType}
                `)
            );
        } else if (executionIssueDetails.length > 1) {
            throw new Error(
                dedent(`
                    Found multiple issue types named: ${this.parameters.testExecutionIssueType}

                    Make sure to only make a single one available in project ${this.parameters.projectKey}.

                    For more information, visit:
                    - ${HELP.plugin.configuration.jira.testExecutionIssueType}
                    - ${HELP.plugin.configuration.jira.testPlanIssueType}
                `)
            );
        }
        return executionIssueDetails[0];
    }
}
