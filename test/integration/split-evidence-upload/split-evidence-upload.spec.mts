import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";
import { runCypress } from "../../sh.mjs";
import { JIRA_CLIENT_CLOUD, XRAY_CLIENT_CLOUD, XRAY_CLIENT_SERVER } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey } from "../util.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/450
// ============================================================================================== //

describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, async () => {
    for (const testCase of [
        {
            linkedTest: "CYP-2414",
            projectDirectory: join(import.meta.dirname, "cloud"),
            projectKey: "CYP",
            service: "cloud",
            title: "evidence uploads can be split into multiple requests (cloud)",
        },
        {
            linkedTest: "CYPLUG-1672",
            projectDirectory: join(import.meta.dirname, "server"),
            projectKey: "CYPLUG",
            service: "server",
            title: "evidence uploads can be split into multiple requests (server)",
        },
    ] as const) {
        await it(testCase.title, async () => {
            const output = runCypress(testCase.projectDirectory, {
                expectedStatusCode: 0,
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
                    testResults.results[0].evidence[0]?.filename,
                    `${testCase.linkedTest} screenshot #1.png`
                );
                assert.deepStrictEqual(
                    testResults.results[0].evidence[1]?.filename,
                    `${testCase.linkedTest} screenshot #2.png`
                );
                assert.deepStrictEqual(
                    testResults.results[0].evidence[2]?.filename,
                    `${testCase.linkedTest} screenshot #3.png`
                );
            }

            if (testCase.service === "server") {
                // Jira server does not like searches immediately after issue creation (socket hang up).
                await setTimeout(10000);
                const testRun = await XRAY_CLIENT_SERVER.testRuns.getTestRun({
                    testExecIssueKey: testExecutionIssueKey,
                    testIssueKey: testCase.linkedTest,
                });
                assert.strictEqual(testRun.evidences.length, 3);
                assert.strictEqual(
                    testRun.evidences[0].fileName,
                    `${testCase.linkedTest} screenshot #1.png`
                );
                assert.strictEqual(
                    testRun.evidences[1].fileName,
                    `${testCase.linkedTest} screenshot #2.png`
                );
                assert.strictEqual(
                    testRun.evidences[2].fileName,
                    `${testCase.linkedTest} screenshot #3.png`
                );
            }
        });
    }
});
