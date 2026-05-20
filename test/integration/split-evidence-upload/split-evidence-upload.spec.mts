import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";
import { runCypress } from "../../sh.mjs";
import { JIRA_CLIENT_CLOUD, XRAY_CLIENT_CLOUD, XRAY_CLIENT_SERVER } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey, shouldRunIntegrationTests } from "../util.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/450
// ============================================================================================== //

void describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, () => {
    if (shouldRunIntegrationTests("cloud")) {
        for (const testCase of [
            {
                expectedScreenshots: [
                    "CXP-14 screenshot #1.png",
                    "CXP-14 screenshot #2.png",
                    "CXP-14 screenshot #3.png",
                ],
                linkedTest: "CXP-14",
                projectDirectory: join(import.meta.dirname, "cloud"),
                projectKey: "CXP",
                title: "evidence uploads can be split into multiple requests (cloud)",
            },
        ] as const) {
            void it(testCase.title, async () => {
                const output = runCypress(testCase.projectDirectory, {
                    expectedStatusCode: 0,
                    includeDefaultEnv: "cloud",
                });

                const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                    testCase.projectKey,
                    output,
                    "cypress"
                );

                const executionIssue = await JIRA_CLIENT_CLOUD.issues.getIssue({
                    fields: ["id"],
                    issueIdOrKey: testExecutionIssueKey,
                });
                const testIssue = await JIRA_CLIENT_CLOUD.issues.getIssue({
                    fields: ["id"],
                    issueIdOrKey: testCase.linkedTest,
                });
                assert.ok(executionIssue.id);
                assert.ok(testIssue.id);
                const testResults = await XRAY_CLIENT_CLOUD.graphql.getTestRuns(
                    {
                        limit: 1,
                        testExecIssueIds: [executionIssue.id],
                        testIssueIds: [testIssue.id],
                    },
                    (testRunResults) => [
                        testRunResults.results((testRun) => [
                            testRun.status((status) => [status.name]),
                            testRun.test((test) => [test.jira({ fields: ["key"] })]),
                            testRun.evidence((evidence) => [evidence.filename]),
                        ]),
                    ]
                );
                assert.strictEqual(testResults.results?.length, 1);
                assert.deepStrictEqual(testResults.results[0]?.status, { name: "PASSED" });
                assert.deepStrictEqual(testResults.results[0].test, {
                    jira: {
                        key: testCase.linkedTest,
                    },
                });
                assert.strictEqual(testResults.results[0].evidence?.length, 3);
                assert.deepStrictEqual(
                    new Set(testResults.results[0].evidence.map((e) => e?.filename)),
                    new Set(testCase.expectedScreenshots)
                );
            });
        }
    }

    if (shouldRunIntegrationTests("server")) {
        for (const testCase of [
            {
                expectedScreenshots: [
                    "CYPLUG-1672 screenshot #1.png",
                    "CYPLUG-1672 screenshot #2.png",
                    "CYPLUG-1672 screenshot #3.png",
                ],
                linkedTest: "CYPLUG-1672",
                projectDirectory: join(import.meta.dirname, "server"),
                projectKey: "CYPLUG",
                title: "evidence uploads can be split into multiple requests (server)",
            },
        ] as const) {
            void it(testCase.title, async () => {
                const output = runCypress(testCase.projectDirectory, {
                    expectedStatusCode: 0,
                    includeDefaultEnv: "server",
                });

                const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                    testCase.projectKey,
                    output,
                    "cypress"
                );

                // Jira server does not like searches immediately after issue creation (socket hang up).
                await setTimeout(10000);
                const testRun = await XRAY_CLIENT_SERVER.testRun.getTestRun({
                    testExecIssueKey: testExecutionIssueKey,
                    testIssueKey: testCase.linkedTest,
                });
                assert.strictEqual(testRun.evidences.length, 3);
                assert.deepStrictEqual(
                    new Set(testRun.evidences.map((e) => e.fileName)),
                    new Set(testCase.expectedScreenshots)
                );
            });
        }
    }
});
