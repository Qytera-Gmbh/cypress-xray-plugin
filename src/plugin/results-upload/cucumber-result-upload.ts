import type { HasImportExecutionCucumberMultipartEndpoint } from "../../client/xray/xray-client";
import type { CucumberMultipartFeature } from "../../models/xray/requests/import-execution-cucumber-multipart";
import type { MultipartInfo } from "../../models/xray/requests/import-execution-multipart-info";

async function uploadCucumberResults(parameters: {
    client: HasImportExecutionCucumberMultipartEndpoint;
    cucumberJson: CucumberMultipartFeature[];
    multipartInfo: MultipartInfo;
}) {
    const testExecutionIssueKey = await parameters.client.importExecutionCucumberMultipart(
        parameters.cucumberJson,
        parameters.multipartInfo
    );
    return {
        testExecutionIssueKey: testExecutionIssueKey,
    };
}

/**
 * Workaround until module mocking becomes a stable feature. The current approach allows replacing
 * the functions with a mocked one.
 *
 * @see https://nodejs.org/docs/latest-v23.x/api/test.html#mockmodulespecifier-options
 */
export default { uploadCucumberResults };
