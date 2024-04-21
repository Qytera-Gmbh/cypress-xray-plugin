import { dedent } from "../../../util/dedent";
import { SkippedError } from "../../../util/errors";
import { LOG, Level } from "../../../util/logging";
import { Command, CommandDescription, Computable } from "../../command";

interface Parameters {
    url: string;
}

export class VerifyResultsUploadCommand extends Command<string, Parameters> {
    private readonly resolvedCypressExecutionIssueKey?: Computable<string | undefined>;
    private readonly resolvedCucumberExecutionIssueKey?: Computable<string | undefined>;

    constructor(
        parameters: Parameters,
        inputs?: {
            cypressExecutionIssueKey?: Computable<string | undefined>;
            cucumberExecutionIssueKey?: Computable<string | undefined>;
        }
    ) {
        super(parameters);
        this.resolvedCypressExecutionIssueKey = inputs?.cypressExecutionIssueKey;
        this.resolvedCucumberExecutionIssueKey = inputs?.cucumberExecutionIssueKey;
    }

    public getDescription(): CommandDescription {
        return {
            description: dedent(`
                Verifies that the test result upload was successful and returns the corresponding Jira test execution issue key.

                If both Cucumber and Cypress results were uploaded, the command furthermore verifies that both uploads targeted the same test execution issue.
            `),
            runtimeInputs: [
                "the actual Jira test execution issue key Xray created or modified during upload",
            ],
        };
    }

    protected async computeResult(): Promise<string> {
        const cypressExecutionIssueKey = await this.resolvedCypressExecutionIssueKey?.compute();
        const cucumberExecutionIssueKey = await this.resolvedCucumberExecutionIssueKey?.compute();
        if (cypressExecutionIssueKey && cucumberExecutionIssueKey) {
            if (cypressExecutionIssueKey !== cucumberExecutionIssueKey) {
                throw new SkippedError(
                    dedent(`
                        Cucumber execution results were imported to a different test execution issue than the Cypress execution results
                          Cypress test execution issue:  ${cypressExecutionIssueKey} ${this.parameters.url}/browse/${cypressExecutionIssueKey}
                          Cucumber test execution issue: ${cucumberExecutionIssueKey} ${this.parameters.url}/browse/${cucumberExecutionIssueKey}

                        Make sure your Jira configuration does not prevent modifications of existing test executions
                    `)
                );
            } else {
                LOG.message(
                    Level.SUCCESS,
                    `Uploaded test results to issue: ${cypressExecutionIssueKey} (${this.parameters.url}/browse/${cypressExecutionIssueKey})`
                );
                return cypressExecutionIssueKey;
            }
        } else if (cypressExecutionIssueKey) {
            LOG.message(
                Level.SUCCESS,
                `Uploaded Cypress test results to issue: ${cypressExecutionIssueKey} (${this.parameters.url}/browse/${cypressExecutionIssueKey})`
            );
            return cypressExecutionIssueKey;
        } else if (cucumberExecutionIssueKey) {
            LOG.message(
                Level.SUCCESS,
                `Uploaded Cucumber test results to issue: ${cucumberExecutionIssueKey} (${this.parameters.url}/browse/${cucumberExecutionIssueKey})`
            );
            return cucumberExecutionIssueKey;
        }
        throw new SkippedError("No test results were uploaded");
    }
}
