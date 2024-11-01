import type { IssueTypeDetails } from "../../../types/jira/responses/issue-type-details.js";
import { dedent } from "../../../util/dedent.js";
import { HELP } from "../../../util/help.js";
import type { Logger } from "../../../util/logging.js";
import { Level } from "../../../util/logging.js";
import type { Computable } from "../../command.js";
import { Command } from "../../command.js";

interface Parameters {
    displayCloudHelp: boolean;
    importType: "cucumber" | "cypress";
    testExecutionIssueKey?: string;
    testExecutionIssueType: IssueTypeDetails;
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
        if (
            this.parameters.testExecutionIssueKey &&
            resolvedExecutionIssueKey !== this.parameters.testExecutionIssueKey
        ) {
            this.logger.message(
                Level.WARNING,
                dedent(`
                    ${
                        this.parameters.importType === "cypress" ? "Cypress" : "Cucumber"
                    } execution results were imported to test execution ${resolvedExecutionIssueKey}, which is different from the configured one: ${
                    this.parameters.testExecutionIssueKey
                }

                    Make sure issue ${
                        this.parameters.testExecutionIssueKey
                    } actually exists and is of type: ${JSON.stringify(
                    this.parameters.testExecutionIssueType,
                    null,
                    2
                )}

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
