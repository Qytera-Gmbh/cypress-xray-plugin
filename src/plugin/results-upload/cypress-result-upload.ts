import type { HasImportExecutionMultipartEndpoint } from "../../client/xray/xray-client";
import type {
    HasAddEvidenceToTestRunEndpoint,
    HasGetTestRunResultsEndpoint,
} from "../../client/xray/xray-client-cloud";
import type {
    HasAddEvidenceEndpoint,
    HasGetTestRunEndpoint,
} from "../../client/xray/xray-client-server";
import type {
    XrayEvidenceItem,
    XrayTestExecutionResults,
} from "../../models/xray/import-test-execution-results";
import type { MultipartInfo } from "../../models/xray/requests/import-execution-multipart-info";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/errors";
import type { Logger } from "../../util/logging";
import { unknownToString } from "../../util/string";

async function uploadCypressResults(parameters: {
    client: HasImportExecutionMultipartEndpoint &
        (
            | (HasGetTestRunEndpoint & HasAddEvidenceEndpoint)
            | (HasGetTestRunResultsEndpoint & HasAddEvidenceToTestRunEndpoint)
        );
    logger: Pick<Logger, "message">;
    multipartInfo: MultipartInfo;
    options: {
        plugin: {
            splitUpload: "sequential" | boolean;
        };
    };
    xrayJson: XrayTestExecutionResults;
}) {
    let testExecutionIssueKey: string;
    if (parameters.options.plugin.splitUpload) {
        const evidencyByTestIssue = new Map<string, XrayEvidenceItem[]>();
        if (parameters.xrayJson.tests) {
            for (const test of parameters.xrayJson.tests) {
                if (test.testKey && test.evidence) {
                    evidencyByTestIssue.set(test.testKey, test.evidence);
                    delete test.evidence;
                }
            }
        }
        testExecutionIssueKey = await parameters.client.importExecutionMultipart(
            parameters.xrayJson,
            parameters.multipartInfo
        );
        const entries = [...evidencyByTestIssue.entries()];
        const uploadCallbacks = entries.map(async ([issueKey, evidences]) => {
            try {
                await uploadTestEvidences({
                    client: parameters.client,
                    evidences: evidences,
                    issueKey: issueKey,
                    logger: parameters.logger,
                    splitUpload: parameters.options.plugin.splitUpload,
                    testExecIssueKey: testExecutionIssueKey,
                });
            } catch (error: unknown) {
                parameters.logger.message(
                    "warning",
                    dedent(`
                        Failed to attach evidences of test ${issueKey} to test execution ${testExecutionIssueKey}:

                          ${errorMessage(error)}
                    `)
                );
            }
        });
        await Promise.all(uploadCallbacks);
    } else {
        testExecutionIssueKey = await parameters.client.importExecutionMultipart(
            parameters.xrayJson,
            parameters.multipartInfo
        );
    }
    return { testExecutionIssueKey };
}

async function uploadTestEvidences(parameters: {
    client:
        | (HasGetTestRunEndpoint & HasAddEvidenceEndpoint)
        | (HasGetTestRunResultsEndpoint & HasAddEvidenceToTestRunEndpoint);
    evidences: XrayEvidenceItem[];
    issueKey: string;
    logger: Pick<Logger, "message">;
    splitUpload: "sequential" | boolean;
    testExecIssueKey: string;
}) {
    const uploadCallback = await getUploadCallback({
        client: parameters.client,
        logger: parameters.logger,
        testExecIssueKey: parameters.testExecIssueKey,
        testIssueKey: parameters.issueKey,
    });
    if (parameters.splitUpload === "sequential") {
        for (const evidence of parameters.evidences) {
            await uploadCallback(evidence);
        }
    } else {
        await Promise.all(parameters.evidences.map(uploadCallback));
    }
}

async function uploadEvidenceServer(parameters: {
    client: HasAddEvidenceEndpoint;
    logger: Pick<Logger, "message">;
    testRunConfig: {
        evidence: XrayEvidenceItem;
        issueKey: string;
        testExecIssueKey: string;
        testRunId: number;
    };
}) {
    try {
        await parameters.client.addEvidence(
            parameters.testRunConfig.testRunId,
            parameters.testRunConfig.evidence
        );
    } catch (error: unknown) {
        parameters.logger.message(
            "warning",
            dedent(`
                Failed to attach evidence ${parameters.testRunConfig.evidence.filename} of test ${parameters.testRunConfig.issueKey} to test execution ${parameters.testRunConfig.testExecIssueKey}:

                  ${errorMessage(error)}
            `)
        );
    }
}

async function uploadEvidenceCloud(parameters: {
    client: HasAddEvidenceToTestRunEndpoint;
    logger: Pick<Logger, "message">;
    testRunConfig: {
        evidence: XrayEvidenceItem;
        issueKey: string;
        testExecIssueKey: string;
        testRunId: string;
    };
}) {
    try {
        const result = await parameters.client.addEvidenceToTestRun({
            evidence: [parameters.testRunConfig.evidence],
            id: parameters.testRunConfig.testRunId,
        });
        for (const warning of result.warnings) {
            parameters.logger.message(
                "warning",
                dedent(`
                    Xray warning occurred during upload of evidence ${parameters.testRunConfig.evidence.filename} of test ${parameters.testRunConfig.issueKey} to test execution ${parameters.testRunConfig.testExecIssueKey}:

                      ${warning}
                `)
            );
        }
    } catch (error: unknown) {
        parameters.logger.message(
            "warning",
            dedent(`
                Failed to attach evidence ${parameters.testRunConfig.evidence.filename} of test ${parameters.testRunConfig.issueKey} to test execution ${parameters.testRunConfig.testExecIssueKey}:

                  ${errorMessage(error)}
            `)
        );
    }
}

function supportsServerEndpoints(
    client:
        | (HasGetTestRunEndpoint & HasAddEvidenceEndpoint)
        | (HasGetTestRunResultsEndpoint & HasAddEvidenceToTestRunEndpoint)
): client is HasGetTestRunEndpoint & HasAddEvidenceEndpoint {
    return "getTestRun" in client && "addEvidence" in client;
}

async function getUploadCallback(parameters: {
    client:
        | (HasGetTestRunEndpoint & HasAddEvidenceEndpoint)
        | (HasGetTestRunResultsEndpoint & HasAddEvidenceToTestRunEndpoint);
    logger: Pick<Logger, "message">;
    testExecIssueKey: string;
    testIssueKey: string;
}): Promise<(evidence: XrayEvidenceItem) => Promise<void>> {
    if (supportsServerEndpoints(parameters.client)) {
        const serverClient = parameters.client;
        const testRun = await serverClient.getTestRun({
            testExecIssueKey: parameters.testExecIssueKey,
            testIssueKey: parameters.testIssueKey,
        });
        return (evidence) =>
            uploadEvidenceServer({
                client: serverClient,
                logger: parameters.logger,
                testRunConfig: {
                    evidence,
                    issueKey: parameters.testIssueKey,
                    testExecIssueKey: parameters.testExecIssueKey,
                    testRunId: testRun.id,
                },
            });
    }
    const cloudClient = parameters.client;
    const testRuns = await cloudClient.getTestRunResults({
        testExecIssueIds: [parameters.testExecIssueKey],
        testIssueIds: [parameters.testIssueKey],
    });
    return (evidence) => {
        if (testRuns.length === 0) {
            throw new Error(
                `Zero test runs were found for test execution ${parameters.testExecIssueKey} and test ${parameters.testIssueKey}`
            );
        }
        if (testRuns.length > 1) {
            throw new Error(
                dedent(`
                    Multiple test runs were found for test execution ${parameters.testExecIssueKey} and test ${parameters.testIssueKey}:

                      ${testRuns.map((testRun) => unknownToString(testRun, true)).join("\n\n")}
                `)
            );
        }
        if (!testRuns[0].id) {
            throw new Error(
                dedent(`
                    Test run without ID found for test execution ${parameters.testExecIssueKey} and test ${parameters.testIssueKey}:

                      ${unknownToString(testRuns[0], true)}
                `)
            );
        }
        return uploadEvidenceCloud({
            client: cloudClient,
            logger: parameters.logger,
            testRunConfig: {
                evidence,
                issueKey: parameters.testIssueKey,
                testExecIssueKey: parameters.testExecIssueKey,
                testRunId: testRuns[0].id,
            },
        });
    };
}

/**
 * Workaround until module mocking becomes a stable feature. The current approach allows replacing
 * the functions with a mocked one.
 *
 * @see https://nodejs.org/docs/latest-v23.x/api/test.html#mockmodulespecifier-options
 */
export default { uploadCypressResults };
