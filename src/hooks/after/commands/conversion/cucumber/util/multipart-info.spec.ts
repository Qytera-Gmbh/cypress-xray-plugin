import { expect } from "chai";
import path from "path";
import { dedent } from "../../../../../../util/dedent";
import { buildMultipartInfoCloud, buildMultipartInfoServer } from "./multipart-info";

describe(path.relative(process.cwd(), __filename), () => {
    describe(buildMultipartInfoCloud.name, () => {
        it("adds default information", () => {
            const info = buildMultipartInfoCloud(
                {
                    startedTestsAt: "2023-09-28T15:51:36.000Z",
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                },
                {
                    projectKey: "CYP",
                    issuetype: {
                        name: "Test Execution (QA)",
                        subtask: false,
                    },
                }
            );
            expect(info).to.deep.eq({
                fields: {
                    project: {
                        key: "CYP",
                    },
                    summary: "Execution Results [1695916296000]",
                    description: dedent(`
                        Cypress version: 13.2.0
                        Browser: Chromium (1.2.3)
                    `),
                    issuetype: {
                        name: "Test Execution (QA)",
                        subtask: false,
                    },
                },
                xrayFields: {
                    testPlanKey: undefined,
                    environments: undefined,
                },
            });
        });

        it("uses provided summaries", () => {
            const info = buildMultipartInfoCloud(
                {
                    startedTestsAt: "2023-09-28 17:51:36",
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                },
                {
                    projectKey: "CYP",
                    summary: "Hello",
                    issuetype: {
                        subtask: false,
                    },
                }
            );
            expect(info.fields.summary).to.eq("Hello");
        });

        it("uses provided descriptions", () => {
            const info = buildMultipartInfoCloud(
                {
                    startedTestsAt: "2023-09-28 17:51:36",
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                },
                {
                    projectKey: "CYP",
                    description: "Hello There",
                    issuetype: {
                        subtask: false,
                    },
                }
            );
            expect(info.fields.description).to.eq("Hello There");
        });

        it("uses provided test plans", () => {
            const info = buildMultipartInfoCloud(
                {
                    startedTestsAt: "2023-09-28 17:51:36",
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                },
                {
                    projectKey: "CYP",
                    issuetype: {
                        subtask: false,
                    },
                    testPlan: {
                        issueKey: "CYP-123",
                    },
                }
            );
            expect(info.xrayFields).to.deep.eq({ testPlanKey: "CYP-123", environments: undefined });
        });
    });

    describe(buildMultipartInfoServer.name, () => {
        it("adds default information", () => {
            const info = buildMultipartInfoServer(
                {
                    startedTestsAt: "2023-09-28T15:51:36.000Z",
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                },
                {
                    projectKey: "CYP",
                    issuetype: {
                        subtask: false,
                    },
                }
            );
            expect(info).to.deep.eq({
                fields: {
                    project: {
                        key: "CYP",
                    },
                    summary: "Execution Results [1695916296000]",
                    description: dedent(`
                        Cypress version: 13.2.0
                        Browser: Chromium (1.2.3)
                    `),
                    issuetype: {
                        subtask: false,
                    },
                },
            });
        });

        it("uses provided summaries", () => {
            const info = buildMultipartInfoServer(
                {
                    startedTestsAt: "2023-09-28 17:51:36",
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                },
                {
                    projectKey: "CYP",
                    summary: "Hello",
                    issuetype: {
                        subtask: false,
                    },
                }
            );
            expect(info.fields.summary).to.eq("Hello");
        });

        it("uses provided descriptions", () => {
            const info = buildMultipartInfoServer(
                {
                    startedTestsAt: "2023-09-28 17:51:36",
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                },
                {
                    projectKey: "CYP",
                    description: "Hello There",
                    issuetype: {
                        subtask: false,
                    },
                }
            );
            expect(info.fields.description).to.eq("Hello There");
        });

        it("uses provided test plans", () => {
            const info = buildMultipartInfoServer(
                {
                    startedTestsAt: "2023-09-28 17:51:36",
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                },
                {
                    projectKey: "CYP",
                    issuetype: {
                        subtask: false,
                    },
                    testPlan: {
                        issueKey: "CYP-123",
                        fieldId: "customField_12345",
                    },
                }
            );
            expect(info.fields.customField_12345).to.eq("CYP-123");
        });

        it("uses provided test environments", () => {
            const info = buildMultipartInfoServer(
                {
                    startedTestsAt: "2023-09-28 17:51:36",
                    browserName: "Chromium",
                    browserVersion: "1.2.3",
                    cypressVersion: "13.2.0",
                },
                {
                    projectKey: "CYP",
                    issuetype: {
                        subtask: false,
                    },
                    testEnvironments: {
                        environments: ["DEV"],
                        fieldId: "customField_12345",
                    },
                }
            );
            expect(info.fields.customField_12345).to.deep.eq(["DEV"]);
        });
    });
});
