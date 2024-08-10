import { expect } from "chai";
import path from "path";
import { dedent } from "../../../../../util/dedent";
import { buildMultipartInfoCloud, buildMultipartInfoServer } from "./multipart-info";

describe(path.relative(process.cwd(), __filename), () => {
    describe(buildMultipartInfoCloud.name, () => {
        it("adds default information", () => {
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
            expect(info.fields.summary).to.eq("Execution Results [1695916296000]");
            expect(info.fields.issuetype).to.deep.eq({ name: "Test Execution" });
        });

        it("uses provided summaries", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    issuetype: {},
                    projectKey: "CYP",
                    summary: "Hello",
                }
            );
            expect(info.fields.summary).to.eq("Hello");
        });

        it("uses provided descriptions", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    description: "Hello There",
                    issuetype: {},
                    projectKey: "CYP",
                }
            );
            expect(info.fields.description).to.eq("Hello There");
        });

        it("uses provided test execution issue types", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    issuetype: {
                        name: "Test Execution (QA)",
                    },
                    projectKey: "CYP",
                }
            );
            expect(info.fields.issuetype).to.deep.eq({
                name: "Test Execution (QA)",
            });
        });

        it("uses provided test plans", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    issuetype: {},
                    projectKey: "CYP",
                    testPlan: {
                        value: "CYP-123",
                    },
                }
            );
            expect(info.xrayFields).to.deep.eq({ environments: undefined, testPlanKey: "CYP-123" });
        });

        it("uses provided test environments", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    issuetype: {},
                    projectKey: "CYP",
                    testEnvironments: {
                        value: ["DEV", "TEST"],
                    },
                }
            );
            expect(info.xrayFields).to.deep.eq({
                environments: ["DEV", "TEST"],
                testPlanKey: undefined,
            });
        });

        it("uses provided custom data", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    custom: {
                        fields: { ["customfield_12345"]: [1, 2, 3, 4, 5] },
                        historyMetadata: { actor: { displayName: "Jeff" } },
                        properties: [{ key: "???", value: "???" }],
                        transition: { id: "15" },
                        update: { assignee: [{ edit: "Jeff" }] },
                    },
                    projectKey: "CYP",
                }
            );
            expect(info).to.deep.eq({
                fields: {
                    ["customfield_12345"]: [1, 2, 3, 4, 5],
                    description: dedent(`
                        Cypress version: 13.2.0
                        Browser: Chromium (1.2.3)
                    `),
                    issuetype: {
                        name: "Test Execution",
                    },
                    project: {
                        key: "CYP",
                    },
                    summary: "Execution Results [1695916296000]",
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

        it("prefers custom data to plugin data", () => {
            const info = buildMultipartInfoCloud(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    custom: {
                        fields: {
                            description: "My description",
                            issuetype: { name: "Different Issue Type" },
                            project: { key: "ABC" },
                            summary: "My summary",
                        },
                    },
                    projectKey: "CYP",
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

    describe(buildMultipartInfoServer.name, () => {
        it("adds default information", () => {
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
            expect(info.fields.summary).to.eq("Execution Results [1695916296000]");
            expect(info.fields.issuetype).to.deep.eq({ name: "Test Execution" });
        });

        it("uses provided summaries", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    issuetype: {},
                    projectKey: "CYP",
                    summary: "Hello",
                }
            );
            expect(info.fields.summary).to.eq("Hello");
        });

        it("uses provided descriptions", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    description: "Hello There",
                    issuetype: {},
                    projectKey: "CYP",
                }
            );
            expect(info.fields.description).to.eq("Hello There");
        });

        it("uses provided test execution issue types", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    issuetype: {
                        name: "Test Execution (QA)",
                    },
                    projectKey: "CYP",
                }
            );
            expect(info.fields.issuetype).to.deep.eq({
                name: "Test Execution (QA)",
            });
        });

        it("uses provided test plans", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    issuetype: {},
                    projectKey: "CYP",
                    testPlan: {
                        fieldId: "customField_12345",
                        value: "CYP-123",
                    },
                }
            );
            expect(info.fields.customField_12345).to.deep.eq(["CYP-123"]);
        });

        it("uses provided test environments", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    issuetype: {},
                    projectKey: "CYP",
                    testEnvironments: {
                        fieldId: "customField_12345",
                        value: ["DEV"],
                    },
                }
            );
            expect(info.fields.customField_12345).to.deep.eq(["DEV"]);
        });

        it("uses provided custom data", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    custom: {
                        fields: { ["customfield_12345"]: [1, 2, 3, 4, 5] },
                        historyMetadata: { actor: { displayName: "Jeff" } },
                        properties: [{ key: "???", value: "???" }],
                        transition: { id: "15" },
                        update: { assignee: [{ edit: "Jeff" }] },
                    },
                    projectKey: "CYP",
                }
            );
            expect(info).to.deep.eq({
                fields: {
                    ["customfield_12345"]: [1, 2, 3, 4, 5],
                    description: dedent(`
                        Cypress version: 13.2.0
                        Browser: Chromium (1.2.3)
                    `),
                    issuetype: {
                        name: "Test Execution",
                    },
                    project: {
                        key: "CYP",
                    },
                    summary: "Execution Results [1695916296000]",
                },
                historyMetadata: { actor: { displayName: "Jeff" } },
                properties: [{ key: "???", value: "???" }],
                transition: { id: "15" },
                update: { assignee: [{ edit: "Jeff" }] },
            });
        });

        it("prefers custom data to plugin data", () => {
            const info = buildMultipartInfoServer(
                {
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                    endedTestsAt: "2023-09-28 17:53:36",
                    startedTestsAt: "2023-09-28 17:51:36",
                },
                {
                    custom: {
                        fields: {
                            ["customfield_678"]: ["PROD"],
                            ["customfield_999"]: "CYP-111",
                            description: "My description",
                            issuetype: { name: "Different Issue Type" },
                            project: { key: "ABC" },
                            summary: "My summary",
                        },
                    },
                    projectKey: "CYP",
                    testEnvironments: { fieldId: "customfield_678", value: ["DEV", "TEST"] },
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
