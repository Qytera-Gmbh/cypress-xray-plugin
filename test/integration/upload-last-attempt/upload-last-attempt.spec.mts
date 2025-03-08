import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";
import { runCypress } from "../../sh.mjs";
import { JIRA_CLIENT_CLOUD, XRAY_CLIENT_CLOUD, XRAY_CLIENT_SERVER } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey } from "../util.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/451
// ============================================================================================== //

describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, async () => {
    for (const testCase of [
        {
            linkedTests: ["CYP-2432", "CYP-2434"],
            projectDirectory: join(import.meta.dirname, "cloud"),
            projectKey: "CYP",
            service: "cloud",
            title: "only last attempts are uploaded (cloud)",
        },
        {
            linkedTests: ["CYPLUG-1692", "CYPLUG-1694"],
            projectDirectory: join(import.meta.dirname, "server"),
            projectKey: "CYPLUG",
            service: "server",
            title: "only last attempts are uploaded (server)",
        },
    ] as const) {
        await it(testCase.title, async () => {
            const output = runCypress(testCase.projectDirectory, {
                expectedStatusCode: 1,
                includeDefaultEnv: testCase.service,
            });

            const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                testCase.projectKey,
                output,
                "cypress"
            );

            if (testCase.service === "cloud") {
                const executionIssue = await JIRA_CLIENT_CLOUD.issues.getIssue({
                    fields: ["id"],
                    issueIdOrKey: testExecutionIssueKey,
                });
                const testIssueRetried = await JIRA_CLIENT_CLOUD.issues.getIssue({
                    fields: ["id"],
                    issueIdOrKey: testCase.linkedTests[0],
                });
                const testIssueRetriedScreenshot = await JIRA_CLIENT_CLOUD.issues.getIssue({
                    fields: ["id"],
                    issueIdOrKey: testCase.linkedTests[1],
                });
                assert.ok(executionIssue.id);
                assert.ok(testIssueRetried.id);
                assert.ok(testIssueRetriedScreenshot.id);
                const testResultsRetried = await XRAY_CLIENT_CLOUD.graphql.getTestRuns(
                    {
                        limit: 1,
                        testExecIssueIds: [executionIssue.id],
                        testIssueIds: [testIssueRetried.id],
                    },
                    (testRunResults) => [
                        testRunResults.results((testRun) => [
                            testRun.status((status) => [status.name]),
                            testRun.test((test) => [test.jira({ fields: ["key"] })]),
                            testRun.evidence((evidence) => [evidence.filename]),
                            testRun.iterations({ limit: 100 }, (testRunIterationResults) => [
                                testRunIterationResults.results((testRunIteration) => [
                                    testRunIteration.status((status) => [status.name]),
                                ]),
                            ]),
                        ]),
                    ]
                );
                assert.strictEqual(testResultsRetried.results?.length, 1);
                assert.deepStrictEqual(testResultsRetried.results[0]?.status, { name: "PASSED" });
                assert.deepStrictEqual(testResultsRetried.results[0].test, {
                    jira: {
                        key: testCase.linkedTests[0],
                    },
                });
                assert.strictEqual(testResultsRetried.results[0].evidence?.length, 1);
                assert.strictEqual(
                    testResultsRetried.results[0].evidence[0]?.filename,
                    "CYP-2432 my screenshot (attempt 6).png"
                );
                assert.strictEqual(testResultsRetried.results[0].iterations, { results: [] });
                const testResultsRetriedScreenshot = await XRAY_CLIENT_CLOUD.graphql.getTestRuns(
                    {
                        limit: 1,
                        testExecIssueIds: [executionIssue.id],
                        testIssueIds: [testIssueRetriedScreenshot.id],
                    },
                    (testRunResults) => [
                        testRunResults.results((testRun) => [
                            testRun.status((status) => [status.name]),
                            testRun.test((test) => [test.jira({ fields: ["key"] })]),
                            testRun.evidence((evidence) => [evidence.filename]),
                            testRun.iterations({ limit: 100 }, (testRunIterationResults) => [
                                testRunIterationResults.results((testRunIteration) => [
                                    testRunIteration.status((status) => [status.name]),
                                ]),
                            ]),
                        ]),
                    ]
                );
                assert.deepStrictEqual(testResultsRetriedScreenshot.results?.[0]?.status, {
                    name: "FAILED",
                });
                assert.deepStrictEqual(testResultsRetriedScreenshot.results[0].test, {
                    jira: {
                        key: testCase.linkedTests[0],
                    },
                });
                assert.strictEqual(testResultsRetriedScreenshot.results[0].evidence?.length, 2);
                assert.strictEqual(
                    testResultsRetriedScreenshot.results[0].evidence[0]?.filename,
                    "CYP-2434 my other screenshot (attempt 3).png"
                );
                assert.strictEqual(
                    testResultsRetriedScreenshot.results[0].evidence[1]?.filename,
                    "template spec -- CYP-2434 manual screenshot (failed) (attempt 3).png"
                );
                assert.strictEqual(testResultsRetriedScreenshot.results[0].iterations, {
                    results: [],
                });
            }

            if (testCase.service === "server") {
                // Jira server does not like searches immediately after issue creation (socket hang up).
                await setTimeout(10000);
                const testRunRetried = await XRAY_CLIENT_SERVER.testRuns.getTestRun({
                    testExecIssueKey: testExecutionIssueKey,
                    testIssueKey: testCase.linkedTests[0],
                });
                assert.strictEqual(testRunRetried.evidences.length, 1);
                assert.strictEqual(
                    testRunRetried.evidences[0].fileName,
                    "CYPLUG-1692 my screenshot (attempt 6).png"
                );
                assert.strictEqual(testRunRetried.iterations, undefined);
                const testResultsRetriedScreenshot = await XRAY_CLIENT_SERVER.testRuns.getTestRun({
                    testExecIssueKey: testExecutionIssueKey,
                    testIssueKey: testCase.linkedTests[1],
                });
                assert.strictEqual(testResultsRetriedScreenshot.evidences.length, 2);
                assert.strictEqual(
                    testResultsRetriedScreenshot.evidences[0].fileName,
                    "CYPLUG-1694 my other screenshot (attempt 3).png"
                );
                assert.strictEqual(
                    testResultsRetriedScreenshot.evidences[1].fileName,
                    "template spec -- CYPLUG-1694 manual screenshot (failed) (attempt 3).png"
                );
                assert.strictEqual(testResultsRetriedScreenshot.iterations, undefined);
            }
        });
    }
});
