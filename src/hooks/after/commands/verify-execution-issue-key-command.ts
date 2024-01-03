import { InternalJiraOptions } from "../../../types/plugin";
import { dedent } from "../../../util/dedent";
import { HELP } from "../../../util/help";
import { LOG, Level } from "../../../util/logging";
import { Command, Computable } from "../../command";

type Parameters = Pick<InternalJiraOptions, "testExecutionIssueKey" | "testExecutionIssueType"> & {
    displayCloudHelp: boolean;
    importType: "cypress" | "cucumber";
};

export class VerifyExecutionIssueKeyCommand extends Command<string, Parameters> {
    private readonly resolvedExecutionIssue: Computable<string>;

    constructor(parameters: Parameters, resolvedExecutionIssue: Computable<string>) {
        super(parameters);
        this.resolvedExecutionIssue = resolvedExecutionIssue;
    }

    protected async computeResult(): Promise<string> {
        const resolvedExecutionIssueKey = await this.resolvedExecutionIssue.compute();
        if (resolvedExecutionIssueKey !== this.parameters.testExecutionIssueKey) {
            LOG.message(
                Level.WARNING,
                dedent(`
                    ${
                        this.parameters.importType === "cypress" ? "Cypress" : "Cucumber"
                    } execution results were imported to test execution ${resolvedExecutionIssueKey}, which is different from the configured one: ${
                    this.parameters.testExecutionIssueKey
                }

                    Make sure issue ${
                        this.parameters.testExecutionIssueKey
                    } actually exists and is of type: ${this.parameters.testExecutionIssueType}

                    More information
                    - ${HELP.plugin.configuration.jira.testExecutionIssueType}
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
