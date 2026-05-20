import { dedent } from "../../util/dedent";
import type { Logger } from "../../util/logging";

function validateUploads(parameters: {
    cucumberExecutionIssueKey?: string;
    cypressExecutionIssueKey?: string;
    logger: Pick<Logger, "message">;
    url: string;
}) {
    if (parameters.cypressExecutionIssueKey && parameters.cucumberExecutionIssueKey) {
        if (parameters.cypressExecutionIssueKey === parameters.cucumberExecutionIssueKey) {
            parameters.logger.message(
                "notice",
                `Uploaded test results to issue: ${parameters.cypressExecutionIssueKey} (${parameters.url}/browse/${parameters.cypressExecutionIssueKey})`
            );
            return parameters.cypressExecutionIssueKey;
        }
        parameters.logger.message(
            "warning",
            dedent(`
                Cucumber execution results were imported to a different test execution issue than the Cypress execution results:

                  Cypress  test execution issue: ${parameters.cypressExecutionIssueKey} ${parameters.url}/browse/${parameters.cypressExecutionIssueKey}
                  Cucumber test execution issue: ${parameters.cucumberExecutionIssueKey} ${parameters.url}/browse/${parameters.cucumberExecutionIssueKey}

                Make sure your Jira configuration does not prevent modifications of existing test executions.
            `)
        );
    } else if (parameters.cypressExecutionIssueKey) {
        parameters.logger.message(
            "notice",
            `Uploaded Cypress test results to issue: ${parameters.cypressExecutionIssueKey} (${parameters.url}/browse/${parameters.cypressExecutionIssueKey})`
        );
        return parameters.cypressExecutionIssueKey;
    } else if (parameters.cucumberExecutionIssueKey) {
        parameters.logger.message(
            "notice",
            `Uploaded Cucumber test results to issue: ${parameters.cucumberExecutionIssueKey} (${parameters.url}/browse/${parameters.cucumberExecutionIssueKey})`
        );
        return parameters.cucumberExecutionIssueKey;
    }
}

/**
 * Workaround until module mocking becomes a stable feature. The current approach allows replacing
 * the functions with a mocked one.
 *
 * @see https://nodejs.org/docs/latest-v23.x/api/test.html#mockmodulespecifier-options
 */
export default { validateUploads };
