import type { XrayClient } from "../../../../client/xray/xray-client";
import { XrayClientCloud } from "../../../../client/xray/xray-client-cloud";
import { ServerClient } from "../../../../client/xray/xray-client-server";
import type { XrayEvidenceItem } from "../../../../types/xray/import-test-execution-results";
import { dedent } from "../../../../util/dedent";
import { LOG, type Logger } from "../../../../util/logging";
import { unknownToString } from "../../../../util/string";
import type { Computable } from "../../../command";
import { Command } from "../../../command";

interface CommandParameters {
    splitUpload: "sequential" | boolean;
    xrayClient: XrayClient;
}

export class ImportExecutionCypressCommand extends Command<string, CommandParameters> {
    private readonly execution: Computable<Parameters<XrayClient["importExecutionMultipart"]>>;
    constructor(
        parameters: CommandParameters,
        logger: Logger,
        execution: Computable<Parameters<XrayClient["importExecutionMultipart"]>>
    ) {
        super(parameters, logger);
        this.execution = execution;
    }

    protected async computeResult(): Promise<string> {
        const [results, info] = await this.execution.compute();
        if (!this.parameters.splitUpload) {
            return await this.parameters.xrayClient.importExecutionMultipart(results, info);
        }
        const evidencyByTestIssue = new Map<string, XrayEvidenceItem[]>();
        if (results.tests) {
            for (const test of results.tests) {
                if (test.testKey && test.evidence) {
                    evidencyByTestIssue.set(test.testKey, test.evidence);
                    delete test.evidence;
                }
            }
        }
        const testExecIssueKey = await this.parameters.xrayClient.importExecutionMultipart(
            results,
            info
        );
        const uploadCallbacks = evidencyByTestIssue.entries().map(async ([issueKey, evidences]) => {
            try {
                await this.uploadTestEvidences(issueKey, testExecIssueKey, evidences);
            } catch (error: unknown) {
                LOG.message(
                    "warning",
                    dedent(`
                        Failed to attach evidences of test ${issueKey} to test execution ${testExecIssueKey}:

                          ${unknownToString(error)}
                    `)
                );
            }
        });
        await Promise.all(uploadCallbacks);
        return testExecIssueKey;
    }

    private async uploadTestEvidences(
        issueKey: string,
        testExecIssueKey: string,
        evidences: XrayEvidenceItem[]
    ) {
        let uploadCallbacks: (() => Promise<void>)[] = [];
        if (this.parameters.xrayClient instanceof ServerClient) {
            const serverClient: ServerClient = this.parameters.xrayClient;
            const testRun = await serverClient.getTestRun({
                testExecIssueKey: testExecIssueKey,
                testIssueKey: issueKey,
            });
            uploadCallbacks = evidences.map(
                (evidence) => () =>
                    this.uploadEvidenceServer(serverClient, {
                        evidence,
                        issueKey,
                        testExecIssueKey,
                        testRunId: testRun.id,
                    })
            );
        } else if (this.parameters.xrayClient instanceof XrayClientCloud) {
            const cloudClient: XrayClientCloud = this.parameters.xrayClient;
            const testRuns = await cloudClient.getTestRunResults({
                testExecIssueIds: [testExecIssueKey],
                testIssueIds: [issueKey],
            });
            if (testRuns.length !== 1) {
                throw new Error(
                    `Failed to get test run for test execution ${testExecIssueKey} and test ${issueKey}`
                );
            }
            if (!testRuns[0].id) {
                throw new Error("Test run does not have an ID");
            }
            const id = testRuns[0].id;
            uploadCallbacks = evidences.map(
                (evidence) => () =>
                    this.uploadEvidenceCloud(cloudClient, {
                        evidence,
                        issueKey,
                        testExecIssueKey,
                        testRunId: id,
                    })
            );
        }
        if (this.parameters.splitUpload === "sequential") {
            for (const uploadCallback of uploadCallbacks) {
                await uploadCallback();
            }
        } else {
            await Promise.all(uploadCallbacks.map((callback) => callback()));
        }
    }

    private async uploadEvidenceServer(
        serverClient: ServerClient,
        testRunConfig: {
            evidence: XrayEvidenceItem;
            issueKey: string;
            testExecIssueKey: string;
            testRunId: number;
        }
    ) {
        try {
            await serverClient.addEvidence(testRunConfig.testRunId, testRunConfig.evidence);
        } catch (error: unknown) {
            LOG.message(
                "warning",
                dedent(`
                    Failed to attach evidence of test ${testRunConfig.issueKey} to test execution ${testRunConfig.testExecIssueKey}:

                      ${unknownToString(error)}
                `)
            );
        }
    }

    private async uploadEvidenceCloud(
        cloudClient: XrayClientCloud,
        testRunConfig: {
            evidence: XrayEvidenceItem;
            issueKey: string;
            testExecIssueKey: string;
            testRunId: string;
        }
    ) {
        try {
            await cloudClient.addEvidenceToTestRun({
                evidence: [testRunConfig.evidence],
                id: testRunConfig.testRunId,
            });
        } catch (error: unknown) {
            LOG.message(
                "warning",
                dedent(`
                    Failed to attach evidence of test ${testRunConfig.issueKey} to test execution ${testRunConfig.testExecIssueKey}:

                      ${unknownToString(error)}
                `)
            );
        }
    }
}
