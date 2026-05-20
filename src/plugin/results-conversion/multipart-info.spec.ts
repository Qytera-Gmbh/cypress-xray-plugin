import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "../../util/dedent";
import { buildMultipartInfoCloud, buildMultipartInfoServer } from "./multipart-info";

void describe(relative(cwd(), __filename), () => {
    void describe(buildMultipartInfoCloud.name, () => {
        void it("adds default information", () => {
            const info = buildMultipartInfoCloud({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYP",
                    testExecutionIssue: {},
                },
            });
            assert.deepStrictEqual(info.fields.project, { key: "CYP" });
            assert.deepStrictEqual(
                info.fields.description,
                dedent(`
                    Cypress version: 13.2.0
                    Browser: Chromium (1.2.3)
                `)
            );
            assert.deepStrictEqual(info.fields.issuetype, undefined);
        });

        void it("uses provided summaries", () => {
            const info = buildMultipartInfoCloud({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYP",
                    testExecutionIssue: { fields: { summary: "Hello" } },
                },
            });
            assert.deepStrictEqual(info.fields.summary, "Hello");
        });

        void it("uses provided descriptions", () => {
            const info = buildMultipartInfoCloud({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYP",
                    testExecutionIssue: { fields: { description: "Hello There" } },
                },
            });
            assert.deepStrictEqual(info.fields.description, "Hello There");
        });

        void it("uses provided test execution issue types", () => {
            const info = buildMultipartInfoCloud({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYP",
                    testExecutionIssue: {
                        fields: {
                            issuetype: {
                                name: "Test Execution (QA)",
                            },
                            projectKey: "CYP",
                        },
                    },
                },
            });
            assert.deepStrictEqual(info.fields.issuetype, {
                name: "Test Execution (QA)",
            });
        });

        void it("uses provided test plans", () => {
            const info = buildMultipartInfoCloud({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYP",
                    testExecutionIssue: {},
                    testPlan: {
                        value: "CYP-123",
                    },
                },
            });
            assert.deepStrictEqual(info.xrayFields, {
                environments: undefined,
                testPlanKey: "CYP-123",
            });
        });

        void it("uses provided test environments", () => {
            const info = buildMultipartInfoCloud({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYP",
                    testEnvironments: {
                        value: ["DEV", "TEST"],
                    },
                    testExecutionIssue: {},
                },
            });
            assert.deepStrictEqual(info.xrayFields, {
                environments: ["DEV", "TEST"],
                testPlanKey: undefined,
            });
        });

        void it("uses provided custom data", () => {
            const info = buildMultipartInfoCloud({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYP",
                    testExecutionIssue: {
                        fields: { ["customfield_12345"]: [1, 2, 3, 4, 5] },
                        historyMetadata: { actor: { displayName: "Jeff" } },
                        properties: [{ key: "???", value: "???" }],
                        transition: { id: "15" },
                        update: { assignee: [{ edit: "Jeff" }] },
                    },
                },
            });
            assert.deepStrictEqual(info, {
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

        void it("prefers custom data to plugin data", () => {
            const info = buildMultipartInfoCloud({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYP",
                    testExecutionIssue: {
                        fields: {
                            description: "My description",
                            issuetype: { name: "Different Issue Type" },
                            project: { key: "ABC" },
                            summary: "My summary",
                        },
                    },
                },
            });
            assert.deepStrictEqual(info.fields, {
                description: "My description",
                issuetype: { name: "Different Issue Type" },
                project: { key: "ABC" },
                summary: "My summary",
            });
        });
    });

    void describe(buildMultipartInfoServer.name, () => {
        void it("adds default information", () => {
            const info = buildMultipartInfoServer({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYPLUG",
                    testExecutionIssue: {},
                },
            });
            assert.deepStrictEqual(info.fields.project, {
                key: "CYPLUG",
            });
            assert.deepStrictEqual(
                info.fields.description,
                dedent(`
                    Cypress version: 13.2.0
                    Browser: Chromium (1.2.3)
                `)
            );
            assert.deepStrictEqual(info.fields.summary, undefined);
            assert.deepStrictEqual(info.fields.issuetype, undefined);
        });

        void it("uses provided summaries", () => {
            const info = buildMultipartInfoServer({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYP",
                    testExecutionIssue: { fields: { summary: "Hello" } },
                },
            });
            assert.deepStrictEqual(info.fields.summary, "Hello");
        });

        void it("uses provided descriptions", () => {
            const info = buildMultipartInfoServer({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYP",
                    testExecutionIssue: { fields: { description: "Hello There" } },
                },
            });
            assert.deepStrictEqual(info.fields.description, "Hello There");
        });

        void it("uses provided test execution issue types", () => {
            const info = buildMultipartInfoServer({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYP",
                    testExecutionIssue: {
                        fields: {
                            issuetype: {
                                name: "Test Execution (QA)",
                            },
                        },
                    },
                },
            });
            assert.deepStrictEqual(info.fields.issuetype, {
                name: "Test Execution (QA)",
            });
        });

        void it("uses provided test plans", () => {
            const info = buildMultipartInfoServer({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYP",
                    testExecutionIssue: {},
                    testPlan: {
                        fieldId: "customField_12345",
                        value: "CYP-123",
                    },
                },
            });
            assert.deepStrictEqual(info.fields.customField_12345, ["CYP-123"]);
        });

        void it("uses provided test environments", () => {
            const info = buildMultipartInfoServer({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYP",
                    testEnvironments: {
                        fieldId: "customField_12345",
                        value: ["DEV"],
                    },
                    testExecutionIssue: {},
                },
            });
            assert.deepStrictEqual(info.fields.customField_12345, ["DEV"]);
        });

        void it("uses provided custom data", () => {
            const info = buildMultipartInfoServer({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
                    projectKey: "CYP",
                    testExecutionIssue: {
                        fields: { ["customfield_12345"]: [1, 2, 3, 4, 5] },
                        historyMetadata: { actor: { displayName: "Jeff" } },
                        properties: [{ key: "???", value: "???" }],
                        transition: { id: "15" },
                        update: { assignee: [{ edit: "Jeff" }] },
                    },
                },
            });
            assert.deepStrictEqual(info, {
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

        void it("prefers custom data to plugin data", () => {
            const info = buildMultipartInfoServer({
                browserName: "Chromium",
                browserVersion: "1.2.3",
                cypressVersion: "13.2.0",
                testExecutionIssueData: {
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
                },
            });
            assert.deepStrictEqual(info.fields, {
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
