import { expect } from "chai";
import path from "path";
import { getMockedLogger } from "../../../../../../test/mocks";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import {
    ConvertCucumberInfoCloudCommand,
    ConvertCucumberInfoServerCommand,
} from "./convert-cucumber-info-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ConvertCucumberInfoServerCommand.name, () => {
        it("converts cucumber results into server cucumber info data", async () => {
            const logger = getMockedLogger();
            const command = new ConvertCucumberInfoServerCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    xray: { uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, { subtask: false, id: "issue_1578" }),
                new ConstantCommand(logger, {
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                })
            );
            const info = await command.compute();
            expect(info).to.deep.eq({
                fields: {
                    project: {
                        key: "CYP",
                    },
                    summary: "Execution Results [1694257168829]",
                    description: "Cypress version: 42.4.9\nBrowser: Firefox (123.11.6)",
                    issuetype: { subtask: false, id: "issue_1578" },
                },
            });
        });

        it("includes configured test plan issue keys", async () => {
            const logger = getMockedLogger();
            const command = new ConvertCucumberInfoServerCommand(
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
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                }),
                { testPlanId: new ConstantCommand(logger, "customfield_12345") }
            );
            const info = await command.compute();
            expect(info.fields).to.have.property("customfield_12345", "CYP-123");
        });

        it("includes configured test environments", async () => {
            const logger = getMockedLogger();
            const command = new ConvertCucumberInfoServerCommand(
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
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                }),
                { testEnvironmentsId: new ConstantCommand(logger, "customfield_45678") }
            );
            const info = await command.compute();
            expect(info.fields).to.have.deep.property("customfield_45678", ["DEV", "PROD"]);
        });

        it("throws if no test plan id is supplied", () => {
            const logger = getMockedLogger();
            expect(
                () =>
                    new ConvertCucumberInfoServerCommand(
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
                            startedTestsAt: "2023-09-09T10:59:28.829Z",
                        })
                    )
            ).to.throw("A test plan issue key was supplied without the test plan Jira field ID");
        });

        it("throws if no test environments id is supplied", () => {
            const logger = getMockedLogger();
            expect(
                () =>
                    new ConvertCucumberInfoServerCommand(
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
                            startedTestsAt: "2023-09-09T10:59:28.829Z",
                        })
                    )
            ).to.throw(
                "Test environments were supplied without the test environments Jira field ID"
            );
        });

        it("returns parameters", () => {
            const logger = getMockedLogger();
            const command = new ConvertCucumberInfoServerCommand(
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
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                })
            );
            expect(command.getParameters()).to.deep.eq({
                jira: {
                    projectKey: "CYP",
                },
                xray: { uploadScreenshots: false },
            });
        });
    });

    describe(ConvertCucumberInfoCloudCommand.name, () => {
        it("converts cucumber results into cucumber info data", async () => {
            const logger = getMockedLogger();
            const command = new ConvertCucumberInfoCloudCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    cucumber: { prefixes: { test: "TestName:" } },
                    xray: { uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, { subtask: false, id: "issue_1578" }),
                new ConstantCommand(logger, {
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                })
            );
            const info = await command.compute();
            expect(info).to.deep.eq({
                fields: {
                    project: {
                        key: "CYP",
                    },
                    summary: "Execution Results [1694257168829]",
                    description: "Cypress version: 42.4.9\nBrowser: Firefox (123.11.6)",
                    issuetype: { subtask: false, id: "issue_1578" },
                },
                xrayFields: {
                    testPlanKey: undefined,
                    environments: undefined,
                },
            });
        });

        it("includes configured test plan issue keys", async () => {
            const logger = getMockedLogger();
            const command = new ConvertCucumberInfoCloudCommand(
                {
                    jira: {
                        projectKey: "CYP",
                        testPlanIssueKey: "CYP-123",
                    },
                    cucumber: { prefixes: { test: "TestName:" } },
                    xray: { uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, { subtask: false }),
                new ConstantCommand(logger, {
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                })
            );
            const info = await command.compute();
            expect(info).to.have.deep.property("xrayFields", {
                testPlanKey: "CYP-123",
                environments: undefined,
            });
        });

        it("includes configured test environments", async () => {
            const logger = getMockedLogger();
            const command = new ConvertCucumberInfoCloudCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    cucumber: { prefixes: { test: "TestName:" } },
                    xray: { testEnvironments: ["DEV", "PROD"], uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, { subtask: false }),
                new ConstantCommand(logger, {
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                })
            );
            const info = await command.compute();
            expect(info).to.have.deep.property("xrayFields", {
                testPlanKey: undefined,
                environments: ["DEV", "PROD"],
            });
        });
    });
});
