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
    splitUpload: boolean;
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
        for (const [issueKey, evidences] of evidencyByTestIssue.entries()) {
            if (this.parameters.xrayClient instanceof ServerClient) {
                const serverClient: ServerClient = this.parameters.xrayClient;
                const testRun = await serverClient.getTestRun({
                    testExecIssueKey: testExecIssueKey,
                    testIssueKey: issueKey,
                });
                const evidenceUploads = evidences.map((evidence) =>
                    serverClient.addEvidence(testRun.id, evidence)
                );
                for (const promiseResult of await Promise.allSettled(evidenceUploads)) {
                    if (promiseResult.status === "rejected") {
                        LOG.message(
                            "warning",
                            dedent(`
                                Failed to attach evidence of test ${issueKey} to test execution ${testExecIssueKey}:

                                  ${unknownToString(promiseResult.reason)}
                            `)
                        );
                    }
                }
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
                const evidenceUploads = evidences.map((evidence) =>
                    cloudClient.addEvidenceToTestRun({
                        evidence: [evidence],
                        id: id,
                    })
                );
                for (const promiseResult of await Promise.allSettled(evidenceUploads)) {
                    if (promiseResult.status === "rejected") {
                        LOG.message(
                            "warning",
                            dedent(`
                                Failed to attach evidence of test ${issueKey} to test execution ${testExecIssueKey}:

                                  ${unknownToString(promiseResult.reason)}
                            `)
                        );
                    }
                }
            }
        }
        return testExecIssueKey;
    }
}
