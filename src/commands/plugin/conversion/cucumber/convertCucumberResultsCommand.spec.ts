import { expect } from "chai";
import fs from "fs";
import path from "path";
import { CucumberMultipartFeature } from "../../../../types/xray/requests/importExecutionCucumberMultipart";
import { ConstantCommand } from "../../../constantCommand";
import {
    ConvertCucumberResultsCloudCommand,
    ConvertCucumberResultsServerCommand,
} from "./convertCucumberResultsCommand";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ConvertCucumberResultsServerCommand.name, () => {
        it("converts cucumber results into cucumber multipart data", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberResultsServerCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    xray: { uploadScreenshots: false },
                },
                new ConstantCommand(cucumberReport.slice(0, 1)),
                new ConstantCommand({ subtask: false, id: "issue_1578" }),
                new ConstantCommand({
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                })
            );
            const multipart = await command.compute();
            expect(multipart.features).to.be.an("array").with.length(1);
            expect(multipart.info).to.deep.eq({
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
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberResultsServerCommand(
                {
                    jira: {
                        projectKey: "CYP",
                        testPlanIssueKey: "CYP-123",
                    },
                    xray: { uploadScreenshots: false },
                },
                new ConstantCommand(cucumberReport.slice(0, 1)),
                new ConstantCommand({ subtask: false }),
                new ConstantCommand({
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                }),
                { testPlanId: new ConstantCommand("customfield_12345") }
            );
            const multipart = await command.compute();
            expect(multipart.info.fields).to.have.property("customfield_12345", "CYP-123");
        });

        it("includes configured test environments", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberResultsServerCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    xray: { testEnvironments: ["DEV", "PROD"], uploadScreenshots: false },
                },
                new ConstantCommand(cucumberReport.slice(0, 1)),
                new ConstantCommand({ subtask: false }),
                new ConstantCommand({
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                }),
                { testEnvironmentsId: new ConstantCommand("customfield_45678") }
            );
            const multipart = await command.compute();
            expect(multipart.info.fields).to.have.deep.property("customfield_45678", [
                "DEV",
                "PROD",
            ]);
        });

        it("throws if no test plan id is supplied", () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            expect(
                () =>
                    new ConvertCucumberResultsServerCommand(
                        {
                            jira: {
                                projectKey: "CYP",
                                testPlanIssueKey: "CYP-123",
                            },
                            xray: { uploadScreenshots: false },
                        },
                        new ConstantCommand(cucumberReport.slice(0, 1)),
                        new ConstantCommand({ subtask: false }),
                        new ConstantCommand({
                            browserName: "Firefox",
                            browserVersion: "123.11.6",
                            cypressVersion: "42.4.9",
                            startedTestsAt: "2023-09-09T10:59:28.829Z",
                        })
                    )
            ).to.throw("A test plan issue key was supplied without the test plan Jira field ID");
        });

        it("throws if no test environments id is supplied", () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            expect(
                () =>
                    new ConvertCucumberResultsServerCommand(
                        {
                            jira: {
                                projectKey: "CYP",
                            },
                            xray: { testEnvironments: ["DEV", "PROD"], uploadScreenshots: false },
                        },
                        new ConstantCommand(cucumberReport.slice(0, 1)),
                        new ConstantCommand({ subtask: false }),
                        new ConstantCommand({
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
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberResultsServerCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    xray: { uploadScreenshots: false },
                },
                new ConstantCommand(cucumberReport.slice(0, 1)),
                new ConstantCommand({ subtask: false }),
                new ConstantCommand({
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

    describe(ConvertCucumberResultsCloudCommand.name, () => {
        it("converts cucumber results into cucumber multipart data", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberResultsCloudCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    cucumber: { prefixes: { test: "TestName:" } },
                    xray: { uploadScreenshots: false },
                },
                new ConstantCommand(cucumberReport.slice(0, 1)),
                new ConstantCommand({ subtask: false, id: "issue_1578" }),
                new ConstantCommand({
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                })
            );
            const multipart = await command.compute();
            expect(multipart.features).to.be.an("array").with.length(1);
            expect(multipart.info).to.deep.eq({
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
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberResultsCloudCommand(
                {
                    jira: {
                        projectKey: "CYP",
                        testPlanIssueKey: "CYP-123",
                    },
                    cucumber: { prefixes: { test: "TestName:" } },
                    xray: { uploadScreenshots: false },
                },
                new ConstantCommand(cucumberReport.slice(0, 1)),
                new ConstantCommand({ subtask: false }),
                new ConstantCommand({
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                })
            );
            const multipart = await command.compute();
            expect(multipart.info).to.have.deep.property("xrayFields", {
                testPlanKey: "CYP-123",
                environments: undefined,
            });
        });

        it("includes configured test environments", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberResultsCloudCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    cucumber: { prefixes: { test: "TestName:" } },
                    xray: { testEnvironments: ["DEV", "PROD"], uploadScreenshots: false },
                },
                new ConstantCommand(cucumberReport.slice(0, 1)),
                new ConstantCommand({ subtask: false }),
                new ConstantCommand({
                    browserName: "Firefox",
                    browserVersion: "123.11.6",
                    cypressVersion: "42.4.9",
                    startedTestsAt: "2023-09-09T10:59:28.829Z",
                })
            );
            const multipart = await command.compute();
            expect(multipart.info).to.have.deep.property("xrayFields", {
                testPlanKey: undefined,
                environments: ["DEV", "PROD"],
            });
        });
    });
});
