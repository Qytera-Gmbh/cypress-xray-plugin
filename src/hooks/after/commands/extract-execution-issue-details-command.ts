import { IssueTypeDetails } from "../../../types/jira/responses/issue-type-details";
import { InternalJiraOptions } from "../../../types/plugin";
import { dedent } from "../../../util/dedent";
import { HELP } from "../../../util/help";
import { Command, Computable } from "../../command";

type Parameters = Pick<InternalJiraOptions, "projectKey" | "testExecutionIssueType"> & {
    displayCloudHelp: boolean;
};

export class ExtractExecutionIssueDetailsCommand extends Command<IssueTypeDetails, Parameters> {
    private readonly allIssueDetails: Computable<IssueTypeDetails[]>;

    constructor(parameters: Parameters, allIssueDetails: Computable<IssueTypeDetails[]>) {
        super(parameters);
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
                    Failed to retrieve Jira issue type information of test execution issue type: ${
                        this.parameters.testExecutionIssueType
                    }

                    Make sure Xray's issue types have been added to project ${
                        this.parameters.projectKey
                    } or that you've configured any custom execution issue type accordingly

                      For example, the following plugin configuration will tell Xray to create Jira issues of type "My Custom Issue Type" to document test execution results:

                        {
                          jira: {
                            testExecutionIssueType: "My Custom Issue Type"
                          }
                        }

                    For more information, visit:
                    - ${HELP.plugin.configuration.jira.testExecutionIssueType}
                    - ${
                        this.parameters.displayCloudHelp
                            ? HELP.xray.issueTypeMapping.cloud
                            : HELP.xray.issueTypeMapping.server
                    }
                `)
            );
        } else if (executionIssueDetails.length > 1) {
            throw new Error(
                dedent(`
                    Failed to retrieve Jira issue type information of test execution issue type: ${
                        this.parameters.testExecutionIssueType
                    }

                    There are multiple issue types with this name, make sure to only make a single one available in project ${
                        this.parameters.projectKey
                    }:
                      ${executionIssueDetails
                          .map((details) => `${details.name}: ${JSON.stringify(details)}`)
                          .join("\n")}

                    If none of them is the test execution issue type you're using in project ${
                        this.parameters.projectKey
                    }, please specify the correct text execution issue type in the plugin configuration:

                      {
                        jira: {
                          testExecutionIssueType: "My Custom Issue Type"
                        }
                      }

                    For more information, visit:
                    - ${HELP.plugin.configuration.jira.testExecutionIssueType}
                    - ${
                        this.parameters.displayCloudHelp
                            ? HELP.xray.issueTypeMapping.cloud
                            : HELP.xray.issueTypeMapping.server
                    }
                `)
            );
        }
        return executionIssueDetails[0];
    }
}
