import { JiraOptions } from "../../../types/plugin";
import { dedent } from "../../../util/dedent";
import { getOrCall } from "../../../util/functions";
import { HELP } from "../../../util/help";
import { Level, Logger } from "../../../util/logging";
import { Command, Computable } from "../../command";

interface Parameters {
    displayCloudHelp: boolean;
    importType: "cucumber" | "cypress";
    testExecutionIssue: JiraOptions["testExecutionIssue"];
}

export class VerifyExecutionIssueKeyCommand extends Command<string, Parameters> {
    private readonly resolvedExecutionIssue: Computable<string>;

    constructor(
        parameters: Parameters,
        logger: Logger,
        resolvedExecutionIssue: Computable<string>
    ) {
        super(parameters, logger);
        this.resolvedExecutionIssue = resolvedExecutionIssue;
    }

    protected async computeResult(): Promise<string> {
        const resolvedExecutionIssueKey = await this.resolvedExecutionIssue.compute();
        const issueData = await getOrCall(this.parameters.testExecutionIssue);
        if (issueData?.key && resolvedExecutionIssueKey !== issueData.key) {
            this.logger.message(
                Level.WARNING,
                dedent(`
                    ${
                        this.parameters.importType === "cypress" ? "Cypress" : "Cucumber"
                    } execution results were imported to test execution ${resolvedExecutionIssueKey}, which is different from the configured one: ${
                    issueData.key
                }

                    Make sure issue ${issueData.key} actually exists${
                    issueData.fields?.issuetype
                        ? ` and is of type: ${JSON.stringify(issueData.fields.issuetype, null, 2)}`
                        : ""
                }

                    More information
                    - ${HELP.plugin.configuration.jira.testExecutionIssue.fields.issuetype}
                    - ${
                        this.parameters.displayCloudHelp
                            ? HELP.xray.issueTypeMapping.cloud
                            : HELP.xray.issueTypeMapping.server
                    }
                `)
            );
        }
        return resolvedExecutionIssueKey;
    }
}
