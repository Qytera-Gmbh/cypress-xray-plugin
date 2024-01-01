import { Command, Computable } from "../../../commands/command";
import { LOG, Level } from "../../../logging/logging";
import { dedent } from "../../../util/dedent";

interface Parameters {
    testExecutionIssueKey: string;
    testExecutionIssueType: string;
    importType: "cypress" | "cucumber";
}

export class VerifyExecutionIssueKeyCommand extends Command<string> {
    private readonly parameters: Parameters;
    private readonly resolvedExecutionIssue: Computable<string>;

    constructor(parameters: Parameters, resolvedExecutionIssue: Computable<string>) {
        super();
        this.parameters = parameters;
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
                `)
            );
        }
        return resolvedExecutionIssueKey;
    }
}
