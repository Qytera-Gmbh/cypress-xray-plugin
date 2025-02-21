import assert from "node:assert";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { setTimeout } from "node:timers/promises";
import { runCypress } from "../../sh.mjs";
import { getIntegrationClient } from "../clients.mjs";
import { getCreatedTestExecutionIssueKey } from "../util.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/421
// ============================================================================================== //

describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, async () => {
    for (const test of [
        {
            linkedTest: "CYP-1815",
            projectDirectory: join(import.meta.dirname, "cloud"),
            projectKey: "CYP",
            service: "cloud",
            title: "issue keys defined in describe titles (cloud)",
        },
        {
            linkedTest: "CYPLUG-1082",
            projectDirectory: join(import.meta.dirname, "server"),
            projectKey: "CYPLUG",
            service: "server",
            title: "issue keys defined in describe titles (server)",
        },
    ] as const) {
        await it(test.title, async () => {
            const output = runCypress(test.projectDirectory, {
                expectedStatusCode: 1,
                includeDefaultEnv: test.service,
            });

            const testExecutionIssueKey = getCreatedTestExecutionIssueKey(
                test.projectKey,
                output,
                "cypress"
            );

            if (test.service === "cloud") {
                const searchResult = await getIntegrationClient("jira", test.service).search({
                    fields: ["id"],
                    jql: `issue in (${testExecutionIssueKey}, ${test.linkedTest})`,
                });
                assert.ok(searchResult[0].id);
                assert.ok(searchResult[1].id);
                const testResults = await getIntegrationClient(
                    "xray",
                    test.service
                ).getTestRunResults({
                    testExecIssueIds: [searchResult[0].id],
                    testIssueIds: [searchResult[1].id],
                });
                assert.strictEqual(testResults.length, 1);
                assert.deepStrictEqual(testResults[0].status, { name: "FAILED" });
                assert.deepStrictEqual(testResults[0].test, {
                    jira: {
                        key: test.linkedTest,
                    },
                });
                assert.strictEqual(testResults[0].evidence?.length, 2);
                assert.strictEqual(
                    testResults[0].evidence[0].filename,
                    `${test.linkedTest} Test Suite Name -- Test Method Name 1 (failed).png`
                );
                assert.strictEqual(
                    testResults[0].evidence[1].filename,
                    `${test.linkedTest}-test-evidence-2.png`
                );
                assert.deepStrictEqual(testResults[0].iterations, {
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
            }

            if (test.service === "server") {
                // Jira server does not like searches immediately after issue creation (socket hang up).
                await setTimeout(10000);
                const testExecution = await getIntegrationClient(
                    "xray",
                    test.service
                ).getTestExecution(testExecutionIssueKey);
                const testRun = await getIntegrationClient("xray", test.service).getTestRun(
                    testExecution[0].id
                );
                assert.deepStrictEqual(testRun.status, "FAIL");
                assert.deepStrictEqual(testRun.testKey, test.linkedTest);
                assert.strictEqual(testRun.evidences.length, 2);
                assert.strictEqual(
                    testRun.evidences[0].fileName,
                    `${test.linkedTest} Test Suite Name -- Test Method Name 1 (failed).png`
                );
                assert.strictEqual(
                    testRun.evidences[1].fileName,
                    `${test.linkedTest}-test-evidence-2.png`
                );
                assert.strictEqual(testRun.iterations.length, 2);
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
            }
        });
    }
});
