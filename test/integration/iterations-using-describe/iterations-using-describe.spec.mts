import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";
import { runCypress } from "../../sh.mjs";
import { getIntegrationClient } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey, shouldRunIntegrationTests } from "../util.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/421
// ============================================================================================== //

void describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, () => {
    if (shouldRunIntegrationTests("cloud")) {
        for (const testCase of [
            {
                linkedTest: "CXP-1",
                projectDirectory: join(import.meta.dirname, "cloud"),
                projectKey: "CXP",
                title: "issue keys defined in describe titles (cloud)",
            },
        ] as const) {
            void it(testCase.title, async () => {
                const output = runCypress(testCase.projectDirectory, {
                    expectedStatusCode: 1,
                    includeDefaultEnv: "cloud",
                });

                const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                    testCase.projectKey,
                    output,
                    "cypress"
                );

                const searchResult = await getIntegrationClient(
                    "jira",
                    "cloud"
                ).issueSearch.searchForIssuesUsingJqlEnhancedSearchPost({
                    fields: ["id"],
                    jql: `issue in (${testExecutionIssueKey}, ${testCase.linkedTest})`,
                });
                assert.ok(searchResult.issues?.[0].id);
                assert.ok(searchResult.issues[1].id);
                const testResults = await getIntegrationClient("xray", "cloud").graphql.getTestRuns(
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
                                    testRunIteration.status((stepStatus) => [stepStatus.name]),
                                    testRunIteration.parameters((testRunParameter) => [
                                        testRunParameter.name,
                                        testRunParameter.value,
                                    ]),
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
                assert.strictEqual(testResults.results[0].evidence?.length, 2);
                assert.strictEqual(
                    testResults.results[0].evidence[0]?.filename,
                    `${testCase.linkedTest} Test Suite Name -- Test Method Name 1 (failed).png`
                );
                assert.strictEqual(
                    testResults.results[0].evidence[1]?.filename,
                    `${testCase.linkedTest}-test-evidence-2.png`
                );
                assert.deepStrictEqual(testResults.results[0].iterations, {
                    results: [
                        {
                            parameters: [
                                {
                                    name: "iteration",
                                    value: "1",
                                },
                            ],
                            status: {
                                name: "FAILED",
                            },
                        },
                        {
                            parameters: [
                                {
                                    name: "iteration",
                                    value: "2",
                                },
                            ],
                            status: {
                                name: "PASSED",
                            },
                        },
                    ],
                });
            });
        }
    }

    if (shouldRunIntegrationTests("server")) {
        for (const testCase of [
            {
                linkedTest: "CYPLUG-1082",
                projectDirectory: join(import.meta.dirname, "server"),
                projectKey: "CYPLUG",
                title: "issue keys defined in describe titles (server)",
            },
        ] as const) {
            void it(testCase.title, async () => {
                const output = runCypress(testCase.projectDirectory, {
                    expectedStatusCode: 1,
                    includeDefaultEnv: "server",
                });

                const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                    testCase.projectKey,
                    output,
                    "cypress"
                );

                // Jira server does not like searches immediately after issue creation (socket hang up).
                await setTimeout(10000);
                const testRun = await getIntegrationClient("xray", "server").testRun.getTestRun({
                    testExecIssueKey: testExecutionIssueKey,
                    testIssueKey: testCase.linkedTest,
                });
                assert.deepStrictEqual(testRun.status, "FAIL");
                assert.deepStrictEqual(testRun.testKey, testCase.linkedTest);
                assert.strictEqual(testRun.evidences.length, 2);
                assert.strictEqual(
                    testRun.evidences[0].fileName,
                    `${testCase.linkedTest} Test Suite Name -- Test Method Name 1 (failed).png`
                );
                assert.strictEqual(
                    testRun.evidences[1].fileName,
                    `${testCase.linkedTest}-test-evidence-2.png`
                );
                assert.strictEqual(testRun.iterations?.length, 2);
                // Workaround because of configured status automations for which I don't have permission.
                // Would be "FAIL" normally.
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
            });
        }
    }
});
