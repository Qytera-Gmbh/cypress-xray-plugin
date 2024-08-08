import { expect } from "chai";
import path from "path";
import { dedent } from "../../../../../../util/dedent";
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
                    issuetype: {
                        name: "Test Execution (QA)",
                        subtask: false,
                    },
                    projectKey: "CYP",
                }
            );
            expect(info).to.deep.eq({
                fields: {
                    description: dedent(`
                        Cypress version: 13.2.0
                        Browser: Chromium (1.2.3)
                    `),
                    issuetype: {
                        name: "Test Execution (QA)",
                        subtask: false,
                    },
                    project: {
                        key: "CYP",
                    },
                    summary: "Execution Results [1695916296000]",
                },
                xrayFields: {
                    environments: undefined,
                    testPlanKey: undefined,
                },
            });
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
                    issuetype: {
                        subtask: false,
                    },
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
                    issuetype: {
                        subtask: false,
                    },
                    projectKey: "CYP",
                }
            );
            expect(info.fields.description).to.eq("Hello There");
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
                    issuetype: {
                        subtask: false,
                    },
                    projectKey: "CYP",
                    testPlan: {
                        value: "CYP-123",
                    },
                }
            );
            expect(info.xrayFields).to.deep.eq({ environments: undefined, testPlanKey: "CYP-123" });
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
                    issuetype: {
                        subtask: false,
                    },
                    projectKey: "CYP",
                }
            );
            expect(info).to.deep.eq({
                fields: {
                    description: dedent(`
                        Cypress version: 13.2.0
                        Browser: Chromium (1.2.3)
                    `),
                    issuetype: {
                        subtask: false,
                    },
                    project: {
                        key: "CYP",
                    },
                    summary: "Execution Results [1695916296000]",
                },
            });
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
                    issuetype: {
                        subtask: false,
                    },
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
                    issuetype: {
                        subtask: false,
                    },
                    projectKey: "CYP",
                }
            );
            expect(info.fields.description).to.eq("Hello There");
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
                    issuetype: {
                        subtask: false,
                    },
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
                    issuetype: {
                        subtask: false,
                    },
                    projectKey: "CYP",
                    testEnvironments: {
                        fieldId: "customField_12345",
                        value: ["DEV"],
                    },
                }
            );
            expect(info.fields.customField_12345).to.deep.eq(["DEV"]);
        });
    });
});
