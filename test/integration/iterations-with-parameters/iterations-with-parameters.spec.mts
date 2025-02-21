import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";
import { runCypress } from "../../sh.mjs";
import { JIRA_CLIENT_CLOUD, XRAY_CLIENT_CLOUD, XRAY_CLIENT_SERVER } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey } from "../util.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/452
// ============================================================================================== //

describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, async () => {
    for (const testCase of [
        {
            linkedTest: "CYP-2151",
            projectDirectory: join(import.meta.dirname, "cloud"),
            projectKey: "CYP",
            service: "cloud",
            title: "iteration parameters can be provided (cloud)",
        },
        {
            linkedTest: "CYPLUG-1411",
            projectDirectory: join(import.meta.dirname, "server"),
            projectKey: "CYPLUG",
            service: "server",
            title: "iteration parameters can be provided (server)",
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
                const searchResult =
                    await JIRA_CLIENT_CLOUD.issueSearch.searchForIssuesUsingJqlPost({
                        fields: ["id"],
                        jql: `issue in (${testExecutionIssueKey}, ${testCase.linkedTest})`,
                    });
                assert.ok(searchResult.issues?.[0].id);
                assert.ok(searchResult.issues[1].id);
                const testResults = await XRAY_CLIENT_CLOUD.graphql.getTestRuns(
                    {
                        limit: 1,
                        testExecIssueIds: [searchResult.issues[0].id],
                        testIssueIds: [searchResult.issues[1].id],
                    },
                    (testRunResults) => [
                        testRunResults.results((testRun) => [
                            testRun.status((status) => [status.name]),
                            testRun.test((test) => [test.jira({ fields: ["key"] })]),
                            testRun.evidence((evidence) => [evidence.filename]),
                            testRun.iterations({ limit: 100 }, (testRunIterationResults) => [
                                testRunIterationResults.results((testRunIteration) => [
                                    testRunIteration.parameters((testRunParameter) => [
                                        testRunParameter.name,
                                        testRunParameter.value,
                                    ]),
                                    testRunIteration.status((status) => [status.name]),
                                ]),
                            ]),
                        ]),
                    ]
                );
                assert.strictEqual(testResults.results?.length, 1);
                assert.deepStrictEqual(testResults.results[0]?.status, { name: "FAILED" });
                assert.deepStrictEqual(testResults.results[0].test, {
                    jira: {
                        key: testCase.linkedTest,
                    },
                });
                assert.deepStrictEqual(testResults.results[0].iterations, {
                    results: [
                        {
                            parameters: [
                                { name: "iteration", value: "1" },
                                { name: "hello", value: "there" },
                                { name: "good", value: "morning" },
                                { name: "using", value: "cy.task" },
                                { name: "id", value: "#1" },
                            ],
                            status: { name: "PASSED" },
                        },
                        {
                            parameters: [
                                { name: "iteration", value: "2" },
                                { name: "hello", value: "there" },
                                { name: "good", value: "morning" },
                                { name: "using", value: "cy.task" },
                                { name: "id", value: "#2" },
                            ],
                            status: { name: "PASSED" },
                        },
                        {
                            parameters: [
                                { name: "iteration", value: "3" },
                                { name: "hello", value: "there" },
                                { name: "good", value: "morning" },
                                { name: "using", value: "cy.task" },
                                { name: "id", value: "#3" },
                            ],
                            status: { name: "PASSED" },
                        },
                        {
                            parameters: [
                                { name: "iteration", value: "4" },
                                { name: "hello", value: "there" },
                                { name: "good", value: "morning" },
                                { name: "using", value: "enqueueTask" },
                            ],
                            status: { name: "PASSED" },
                        },
                    ],
                });
            }

            if (testCase.service === "server") {
                // Jira server does not like searches immediately after issue creation (socket hang up).
                await setTimeout(10000);
                const testExecution =
                    await XRAY_CLIENT_SERVER.testExecutions.getTests(testExecutionIssueKey);
                const testRun = await XRAY_CLIENT_SERVER.testRuns.testRun.getTestRun(
                    testExecution[0].id.toString()
                );
                assert.deepStrictEqual(testRun.status, "FAIL");
                assert.deepStrictEqual(testRun.testKey, testCase.linkedTest);
                assert.strictEqual(testRun.iterations?.length, 2);
                // Workaround because of configured status automations for which I don't have permission.
                // Would be "PASS" normally.
                assert.strictEqual(testRun.iterations[0].status, "TODO");
                assert.deepStrictEqual(testRun.iterations[0].parameters, [
                    {
                        name: "iteration",
                        value: "1",
                    },
                ]);
                // Workaround because of configured status automations for which I don't have permission.
                // Would be "PASS" normally.
                assert.deepStrictEqual(testRun.iterations[1].status, "TODO");
                assert.deepStrictEqual(testRun.iterations[1].parameters, [
                    {
                        name: "iteration",
                        value: "2",
                    },
                ]);
            }
        });
    }
});
