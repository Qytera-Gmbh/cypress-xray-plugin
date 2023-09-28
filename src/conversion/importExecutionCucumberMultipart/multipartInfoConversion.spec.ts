import { expect } from "chai";
import { dedent } from "../../util/dedent";
import { getMultipartInfoCloud, getMultipartInfoServer } from "./multipartInfoConversion";

describe("getMultipartInfoCloud", () => {
    it("adds default information", async () => {
        const info = getMultipartInfoCloud(
            {
                startedTestsAt: "2023-09-28 17:51:36",
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
                summary: "Execution Results [123]",
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
            },
        });
    });

    it("uses provided summaries", async () => {
        const info = getMultipartInfoCloud(
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
        const info = getMultipartInfoCloud(
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
        const info = getMultipartInfoCloud(
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
        expect(info.xrayFields).to.deep.eq({ testPlanKey: "CYP-123" });
    });
});

describe("getMultipartInfoServer", () => {
    it("adds default information", async () => {
        const info = getMultipartInfoServer(
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
            }
        );
        expect(info).to.deep.eq({
            fields: {
                project: {
                    key: "CYP",
                },
                summary: "Execution Results [123]",
                description: dedent(`
                    Cypress version: 13.2.0
                    Browser: Chromium (1.2.3)
                `),
                issuetype: {
                    subtask: false,
                },
            },
            xrayFields: {
                testPlanKey: undefined,
            },
        });
    });

    it("uses provided summaries", async () => {
        const info = getMultipartInfoServer(
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
        const info = getMultipartInfoServer(
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
        const info = getMultipartInfoServer(
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
                    testPlanFieldId: "customField_12345",
                },
            }
        );
        expect(info.fields["customField_12345"]).to.eq("CYP-123");
    });
});
