import { IssueTypeDetails } from "../../../types/jira/responses/issue-type-details";
import { dedent } from "../../../util/dedent";
import { HELP } from "../../../util/help";
import { Command, Computable } from "../../command";

interface Parameters {
    projectKey: string;
    testExecutionIssueType: string;
}

export class ExtractExecutionIssueDetailsCommand extends Command<IssueTypeDetails> {
    private readonly parameters: Parameters;
    private readonly allIssueTypes: Computable<IssueTypeDetails[]>;

    constructor(parameters: Parameters, allIssueTypes: Computable<IssueTypeDetails[]>) {
        super();
        this.parameters = parameters;
        this.allIssueTypes = allIssueTypes;
    }

    protected async computeResult(): Promise<IssueTypeDetails> {
        const allIssueTypes = await this.allIssueTypes.compute();
        if (allIssueTypes.length === 0) {
            throw new Error(
                dedent(`
                    Failed to retrieve issue type information for issue type: ${this.parameters.testExecutionIssueType}

                    Make sure you have Xray installed.

                    For more information, visit:
                    - ${HELP.plugin.configuration.jira.testExecutionIssueType}
                    - ${HELP.plugin.configuration.jira.testPlanIssueType}
                `)
            );
        } else if (allIssueTypes.length > 1) {
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
        return allIssueTypes[0];
    }
}
