import { expect } from "chai";
import { dedent } from "../../util/dedent";
import { buildMultipartInfoCloud, buildMultipartInfoServer } from "./multipartInfoBuilder";

describe("buildMultipartInfoCloud", () => {
    it("adds default information", async () => {
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

    it("uses provided summaries", async () => {
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

    it("uses provided descriptions", async () => {
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

    it("uses provided test plans", async () => {
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

describe("buildMultipartInfoServer", () => {
    it("adds default information", async () => {
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

    it("uses provided summaries", async () => {
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

    it("uses provided descriptions", async () => {
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

    it("uses provided test plans", async () => {
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
        expect(info.fields["customField_12345"]).to.eq("CYP-123");
    });

    it("uses provided test environments", async () => {
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
        expect(info.fields["customField_12345"]).to.deep.eq(["DEV"]);
    });
});
