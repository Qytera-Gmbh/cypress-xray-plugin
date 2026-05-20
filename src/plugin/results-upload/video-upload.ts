import type { HasAddAttachmentEndpoint } from "../../client/jira/jira-client";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/errors";
import type { Logger } from "../../util/logging";

async function uploadVideos(parameters: {
    client: HasAddAttachmentEndpoint;
    cypress: {
        results: {
            videos: string[];
        };
    };
    logger: Pick<Logger, "message">;
    options: {
        jira: {
            testExecutionIssueKey: string;
        };
    };
}) {
    if (parameters.cypress.results.videos.length > 0) {
        try {
            return await parameters.client.addAttachment(
                parameters.options.jira.testExecutionIssueKey,
                ...parameters.cypress.results.videos
            );
        } catch (error: unknown) {
            parameters.logger.message(
                "warning",
                dedent(`
                    Failed to upload videos to test execution issue ${parameters.options.jira.testExecutionIssueKey}:

                      ${errorMessage(error)}
                `)
            );
        }
    }
    return [];
}

/**
 * Workaround until module mocking becomes a stable feature. The current approach allows replacing
 * the functions with a mocked one.
 *
 * @see https://nodejs.org/docs/latest-v23.x/api/test.html#mockmodulespecifier-options
 */
export default { uploadVideos };
