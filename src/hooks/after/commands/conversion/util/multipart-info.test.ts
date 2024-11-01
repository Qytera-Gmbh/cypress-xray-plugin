import { expect } from "chai";
import { describe, it } from "node:test";
import { relative } from "path";
import { dedent } from "../../../../../util/dedent.js";
import { buildMultipartInfoCloud, buildMultipartInfoServer } from "./multipart-info.js";

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await describe(buildMultipartInfoCloud.name, async () => {
        await it("adds default information", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28T15:51:36.000Z",
                },
                {
                    projectKey: "CYP",
                    testExecutionIssue: {},
                }
            );
            expect(info.fields.project).to.deep.eq({
                key: "CYP",
            });
            expect(info.fields.description).to.eq(
                dedent(`
                    Cypress version: 13.2.0
                    Browser: Chromium (1.2.3)
                `)
            );
            expect(info.fields.issuetype).to.be.undefined;
        });

        await it("uses provided summaries", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    projectKey: "CYP",
                    testExecutionIssue: { fields: { summary: "Hello" } },
                }
            );
            expect(info.fields.summary).to.eq("Hello");
        });

        await it("uses provided descriptions", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    projectKey: "CYP",
                    testExecutionIssue: { fields: { description: "Hello There" } },
                }
            );
            expect(info.fields.description).to.eq("Hello There");
        });

        await it("uses provided test execution issue types", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    projectKey: "CYP",
                    testExecutionIssue: {
                        fields: {
                            issuetype: {
                                name: "Test Execution (QA)",
                            },
                            projectKey: "CYP",
                        },
                    },
                }
            );
            expect(info.fields.issuetype).to.deep.eq({
                name: "Test Execution (QA)",
            });
        });

        await it("uses provided test plans", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    projectKey: "CYP",
                    testExecutionIssue: {},
                    testPlan: {
                        value: "CYP-123",
                    },
                }
            );
            expect(info.xrayFields).to.deep.eq({ environments: undefined, testPlanKey: "CYP-123" });
        });

        await it("uses provided test environments", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    projectKey: "CYP",
                    testEnvironments: {
                        value: ["DEV", "TEST"],
                    },
                    testExecutionIssue: {},
                }
            );
            expect(info.xrayFields).to.deep.eq({
                environments: ["DEV", "TEST"],
                testPlanKey: undefined,
            });
        });

        await it("uses provided custom data", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28T15:51:36.000Z",
                },
                {
                    projectKey: "CYP",
                    testExecutionIssue: {
                        fields: { ["customfield_12345"]: [1, 2, 3, 4, 5] },
                        historyMetadata: { actor: { displayName: "Jeff" } },
                        properties: [{ key: "???", value: "???" }],
                        transition: { id: "15" },
                        update: { assignee: [{ edit: "Jeff" }] },
                    },
                }
            );
            expect(info).to.deep.eq({
                fields: {
                    ["customfield_12345"]: [1, 2, 3, 4, 5],
                    description: dedent(`
                        Cypress version: 13.2.0
                        Browser: Chromium (1.2.3)
                    `),
                    issuetype: undefined,
                    project: {
                        key: "CYP",
                    },
                    summary: undefined,
                },
                historyMetadata: { actor: { displayName: "Jeff" } },
                properties: [{ key: "???", value: "???" }],
                transition: { id: "15" },
                update: { assignee: [{ edit: "Jeff" }] },
                xrayFields: {
                    environments: undefined,
                    testPlanKey: undefined,
                },
            });
        });

        await it("prefers custom data to plugin data", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    projectKey: "CYP",
                    testExecutionIssue: {
                        fields: {
                            description: "My description",
                            issuetype: { name: "Different Issue Type" },
                            project: { key: "ABC" },
                            summary: "My summary",
                        },
                    },
                }
            );
            expect(info.fields).to.deep.eq({
                description: "My description",
                issuetype: { name: "Different Issue Type" },
                project: { key: "ABC" },
                summary: "My summary",
            });
        });
    });

    await describe(buildMultipartInfoServer.name, async () => {
        await it("adds default information", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28T15:51:36.000Z",
                },
                {
                    projectKey: "CYPLUG",
                    testExecutionIssue: {},
                }
            );
            expect(info.fields.project).to.deep.eq({
                key: "CYPLUG",
            });
            expect(info.fields.description).to.eq(
                dedent(`
                        Cypress version: 13.2.0
                        Browser: Chromium (1.2.3)
                    `)
            );
            expect(info.fields.summary).to.be.undefined;
            expect(info.fields.issuetype).to.be.undefined;
        });

        await it("uses provided summaries", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    projectKey: "CYP",
                    testExecutionIssue: { fields: { summary: "Hello" } },
                }
            );
            expect(info.fields.summary).to.eq("Hello");
        });

        await it("uses provided descriptions", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    projectKey: "CYP",
                    testExecutionIssue: { fields: { description: "Hello There" } },
                }
            );
            expect(info.fields.description).to.eq("Hello There");
        });

        await it("uses provided test execution issue types", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    projectKey: "CYP",
                    testExecutionIssue: {
                        fields: {
                            issuetype: {
                                name: "Test Execution (QA)",
                            },
                        },
                    },
                }
            );
            expect(info.fields.issuetype).to.deep.eq({
                name: "Test Execution (QA)",
            });
        });

        await it("uses provided test plans", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    projectKey: "CYP",
                    testExecutionIssue: {},
                    testPlan: {
                        fieldId: "customField_12345",
                        value: "CYP-123",
                    },
                }
            );
            expect(info.fields.customField_12345).to.deep.eq(["CYP-123"]);
        });

        await it("uses provided test environments", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    projectKey: "CYP",
                    testEnvironments: {
                        fieldId: "customField_12345",
                        value: ["DEV"],
                    },
                    testExecutionIssue: {},
                }
            );
            expect(info.fields.customField_12345).to.deep.eq(["DEV"]);
        });

        await it("uses provided custom data", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28T15:51:36.000Z",
                },
                {
                    projectKey: "CYP",
                    testExecutionIssue: {
                        fields: { ["customfield_12345"]: [1, 2, 3, 4, 5] },
                        historyMetadata: { actor: { displayName: "Jeff" } },
                        properties: [{ key: "???", value: "???" }],
                        transition: { id: "15" },
                        update: { assignee: [{ edit: "Jeff" }] },
                    },
                }
            );
            expect(info).to.deep.eq({
                fields: {
                    ["customfield_12345"]: [1, 2, 3, 4, 5],
                    description: dedent(`
                        Cypress version: 13.2.0
                        Browser: Chromium (1.2.3)
                    `),
                    issuetype: undefined,
                    project: {
                        key: "CYP",
                    },
                    summary: undefined,
                },
                historyMetadata: { actor: { displayName: "Jeff" } },
                properties: [{ key: "???", value: "???" }],
                transition: { id: "15" },
                update: { assignee: [{ edit: "Jeff" }] },
            });
        });

        await it("prefers custom data to plugin data", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    projectKey: "CYP",
                    testEnvironments: { fieldId: "customfield_678", value: ["DEV", "TEST"] },
                    testExecutionIssue: {
                        fields: {
                            ["customfield_678"]: ["PROD"],
                            ["customfield_999"]: "CYP-111",
                            description: "My description",
                            issuetype: { name: "Different Issue Type" },
                            project: { key: "ABC" },
                            summary: "My summary",
                        },
                    },
                    testPlan: { fieldId: "customfield_999", value: "CYP-456" },
                }
            );
            expect(info.fields).to.deep.eq({
                ["customfield_678"]: ["PROD"],
                ["customfield_999"]: "CYP-111",
                description: "My description",
                issuetype: { name: "Different Issue Type" },
                project: { key: "ABC" },
                summary: "My summary",
            });
        });
    });
});
