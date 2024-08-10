import { expect } from "chai";
import path from "path";
import { getMockedLogger } from "../../../../../test/mocks";
import { ConstantCommand } from "../../../util/commands/constant-command";
import { ConvertInfoCloudCommand, ConvertInfoServerCommand } from "./convert-info-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ConvertInfoServerCommand.name, () => {
        it("converts cucumber results into server cucumber info data", async () => {
            const logger = getMockedLogger();
            const command = new ConvertInfoServerCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    xray: { uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, { id: "issue_1578", subtask: false }),
                new ConstantCommand(logger, {
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    endedTestsAt: "2023-09-09T10:59:36.177Z",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                }),
                {
                    summary: new ConstantCommand(logger, "Execution Results [1694257168829]"),
                }
            );
            const info = await command.compute();
            expect(info).to.deep.eq({
                fields: {
                    description: "Cypress version: 42.4.9\nBrowser: Firefox (123.11.6)",
                    issuetype: { id: "issue_1578", subtask: false },
                    project: {
                        key: "CYP",
                    },
                    summary: "Execution Results [1694257168829]",
                },
            });
        });

        it("includes configured test plan issue keys", async () => {
            const logger = getMockedLogger();
            const command = new ConvertInfoServerCommand(
                {
                    jira: {
                        projectKey: "CYP",
                        testPlanIssueKey: "CYP-123",
                    },
                    xray: { uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, { subtask: false }),
                new ConstantCommand(logger, {
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    endedTestsAt: "2023-09-09T10:59:31.416Z",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                }),
                {
                    fieldIds: {
                        testPlanId: new ConstantCommand(logger, "customfield_12345"),
                    },
                    summary: new ConstantCommand(logger, "my summary"),
                }
            );
            const info = await command.compute();
            expect(info.fields).to.have.deep.property("customfield_12345", ["CYP-123"]);
        });

        it("includes configured test environments", async () => {
            const logger = getMockedLogger();
            const command = new ConvertInfoServerCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    xray: { testEnvironments: ["DEV", "PROD"], uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, { subtask: false }),
                new ConstantCommand(logger, {
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    endedTestsAt: "2023-09-09T10:59:31.416Z",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                }),
                {
                    fieldIds: {
                        testEnvironmentsId: new ConstantCommand(logger, "customfield_45678"),
                    },
                    summary: new ConstantCommand(logger, "my summary"),
                }
            );
            const info = await command.compute();
            expect(info.fields).to.have.deep.property("customfield_45678", ["DEV", "PROD"]);
        });

        it("throws if no test plan id is supplied", () => {
            const logger = getMockedLogger();
            expect(
                () =>
                    new ConvertInfoServerCommand(
                        {
                            jira: {
                                projectKey: "CYP",
                                testPlanIssueKey: "CYP-123",
                            },
                            xray: { uploadScreenshots: false },
                        },
                        logger,
                        new ConstantCommand(logger, { subtask: false }),
                        new ConstantCommand(logger, {
                            browserName: "Firefox",
                            browserVersion: "123.11.6",
                            cypressVersion: "42.4.9",
                            endedTestsAt: "2023-09-09T10:59:31.416Z",
                            startedTestsAt: "2023-09-09T10:59:28.829Z",
                        }),
                        {
                            summary: new ConstantCommand(logger, "my summary"),
                        }
                    )
            ).to.throw("A test plan issue key was supplied without the test plan Jira field ID");
        });

        it("throws if no test environments id is supplied", () => {
            const logger = getMockedLogger();
            expect(
                () =>
                    new ConvertInfoServerCommand(
                        {
                            jira: {
                                projectKey: "CYP",
                            },
                            xray: { testEnvironments: ["DEV", "PROD"], uploadScreenshots: false },
                        },
                        logger,
                        new ConstantCommand(logger, { subtask: false }),
                        new ConstantCommand(logger, {
                            browserName: "Firefox",
                            browserVersion: "123.11.6",
                            cypressVersion: "42.4.9",
                            endedTestsAt: "2023-09-09T10:59:31.416Z",
                            startedTestsAt: "2023-09-09T10:59:28.829Z",
                        }),
                        {
                            summary: new ConstantCommand(logger, "my summary"),
                        }
                    )
            ).to.throw(
                "Test environments were supplied without the test environments Jira field ID"
            );
        });

        it("returns parameters", () => {
            const logger = getMockedLogger();
            const command = new ConvertInfoServerCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    xray: { uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, { subtask: false }),
                new ConstantCommand(logger, {
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    endedTestsAt: "2023-09-09T10:59:31.416Z",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                }),
                {
                    summary: new ConstantCommand(logger, "my summary"),
                }
            );
            expect(command.getParameters()).to.deep.eq({
                jira: {
                    projectKey: "CYP",
                },
                xray: { uploadScreenshots: false },
            });
        });
    });

    describe(ConvertInfoCloudCommand.name, () => {
        it("converts cucumber results into cucumber info data", async () => {
            const logger = getMockedLogger();
            const command = new ConvertInfoCloudCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    xray: { uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, { id: "issue_1578", subtask: false }),
                new ConstantCommand(logger, {
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    endedTestsAt: "2023-09-09T10:59:31.416Z",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                }),
                {
                    summary: new ConstantCommand(logger, "Execution Results [1694257168829]"),
                }
            );
            const info = await command.compute();
            expect(info).to.deep.eq({
                fields: {
                    description: "Cypress version: 42.4.9\nBrowser: Firefox (123.11.6)",
                    issuetype: { id: "issue_1578", subtask: false },
                    project: {
                        key: "CYP",
                    },
                    summary: "Execution Results [1694257168829]",
                },
                xrayFields: {
                    environments: undefined,
                    testPlanKey: undefined,
                },
            });
        });

        it("includes configured test plan issue keys", async () => {
            const logger = getMockedLogger();
            const command = new ConvertInfoCloudCommand(
                {
                    jira: {
                        projectKey: "CYP",
                        testPlanIssueKey: "CYP-123",
                    },
                    xray: { uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, { subtask: false }),
                new ConstantCommand(logger, {
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    endedTestsAt: "2023-09-09T10:59:31.416Z",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                }),
                {
                    summary: new ConstantCommand(logger, "my summary"),
                }
            );
            const info = await command.compute();
            expect(info).to.have.deep.property("xrayFields", {
                environments: undefined,
                testPlanKey: "CYP-123",
            });
        });

        it("includes configured test environments", async () => {
            const logger = getMockedLogger();
            const command = new ConvertInfoCloudCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    xray: { testEnvironments: ["DEV", "PROD"], uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, { subtask: false }),
                new ConstantCommand(logger, {
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    endedTestsAt: "2023-09-09T10:59:31.416Z",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                }),
                {
                    summary: new ConstantCommand(logger, "my summary"),
                }
            );
            const info = await command.compute();
            expect(info).to.have.deep.property("xrayFields", {
                environments: ["DEV", "PROD"],
                testPlanKey: undefined,
            });
        });
    });
});
