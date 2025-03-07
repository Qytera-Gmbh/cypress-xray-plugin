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
            linkedTest: "CYP-2151",
            projectDirectory: join(import.meta.dirname, "cloud"),
            projectKey: "CYP",
            service: "cloud",
            title: "evidence uploads can be split into multiple requests (cloud)",
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
                assert.deepStrictEqual(
                    testResults.results[0].evidence?.[0]?.filename,
                    "CYP-2414 screenshot #1.png"
                );
                assert.deepStrictEqual(
                    testResults.results[0].evidence[1]?.filename,
                    "CYP-2414 screenshot #2.png"
                );
                assert.deepStrictEqual(
                    testResults.results[0].evidence[2]?.filename,
                    "CYP-2414 screenshot #3.png"
                );
            }

            if (testCase.service === "server") {
                // Jira server does not like searches immediately after issue creation (socket hang up).
                await setTimeout(10000);
                const testRun = await XRAY_CLIENT_SERVER.testRuns.getTestRun({
                    testExecIssueKey: testExecutionIssueKey,
                    testIssueKey: testCase.linkedTest,
                });
                assert.deepStrictEqual(testRun.status, "PASS");
                assert.deepStrictEqual(testRun.testKey, testCase.linkedTest);
                assert.strictEqual(testRun.iterations?.length, 4);
                // Workarounds because of configured status automations for which I don't have permission.
                // "TODO" Would be "PASS" normally.
                assert.strictEqual(testRun.iterations[0].status, "TODO");
                assert.deepStrictEqual(testRun.iterations[0].parameters, [
                    { name: "iteration", value: "1" },
                    { name: "hello", value: "there" },
                    { name: "good", value: "morning" },
                    { name: "using", value: "cy.task" },
                    { name: "id", value: "#1" },
                ]);
                assert.strictEqual(testRun.iterations[1].status, "TODO");
                assert.deepStrictEqual(testRun.iterations[1].parameters, [
                    { name: "iteration", value: "2" },
                    { name: "hello", value: "there" },
                    { name: "good", value: "morning" },
                    { name: "using", value: "cy.task" },
                    { name: "id", value: "#2" },
                ]);
                assert.strictEqual(testRun.iterations[2].status, "TODO");
                assert.deepStrictEqual(testRun.iterations[2].parameters, [
                    { name: "iteration", value: "3" },
                    { name: "hello", value: "there" },
                    { name: "good", value: "morning" },
                    { name: "using", value: "cy.task" },
                    { name: "id", value: "#3" },
                ]);
                assert.strictEqual(testRun.iterations[3].status, "TODO");
                assert.deepStrictEqual(testRun.iterations[3].parameters, [
                    { name: "iteration", value: "4" },
                    { name: "hello", value: "there" },
                    { name: "good", value: "morning" },
                    { name: "using", value: "enqueueTask" },
                    { name: "id", value: "" },
                ]);
            }
        });
    }
});
