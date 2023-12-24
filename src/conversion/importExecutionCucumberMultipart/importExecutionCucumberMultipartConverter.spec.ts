import { expect } from "chai";
import { readFileSync } from "fs";
import { SinonStubbedInstance } from "sinon";
import { getMockedJiraRepository } from "../../../test/mocks";
import { SupportedField } from "../../repository/jira/fields/jiraIssueFetcher";
import { JiraRepository } from "../../repository/jira/jiraRepository";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { ImportExecutionCucumberMultipartConverter } from "./importExecutionCucumberMultipartConverter";

describe("the import execution cucumber multpart converter", () => {
    let jiraRepository: SinonStubbedInstance<JiraRepository>;

    beforeEach(() => {
        jiraRepository = getMockedJiraRepository();
    });

    describe("server", () => {
        it("converts cucumber JSON into Xray JSON", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const converter = new ImportExecutionCucumberMultipartConverter(
                {
                    jira: {
                        projectKey: "CYP",
                        testExecutionIssueDetails: { subtask: false, id: "issue_1578" },
                    },
                    xray: { uploadScreenshots: false },
                },
                false,
                jiraRepository
            );
            const multipartJson = await converter.convert([cucumberReport[0]], {
                browserName: "Firefox",
                browserVersion: "123.11.6",
                cypressVersion: "42.4.9",
                startedTestsAt: "2023-09-09T10:59:28.829Z",
            });
            expect(multipartJson.features).to.be.an("array").with.length(1);
            expect(multipartJson.info).to.deep.eq({
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
                readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            jiraRepository.getFieldId
                .withArgs(SupportedField.TEST_PLAN)
                .resolves("customfield_12345");
            const converter = new ImportExecutionCucumberMultipartConverter(
                {
                    jira: {
                        projectKey: "CYP",
                        testPlanIssueKey: "CYP-123",
                        testExecutionIssueDetails: { subtask: false },
                    },
                    xray: { uploadScreenshots: false },
                },
                false,
                jiraRepository
            );
            const multipartJson = await converter.convert([cucumberReport[0]], {
                browserName: "Firefox",
                browserVersion: "123.11.6",
                cypressVersion: "42.4.9",
                startedTestsAt: "2023-09-09T10:59:28.829Z",
            });
            expect(multipartJson.info.fields).to.have.property("customfield_12345", "CYP-123");
        });

        it("includes configured test environments", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            jiraRepository.getFieldId
                .withArgs(SupportedField.TEST_ENVIRONMENTS)
                .resolves("customfield_45678");
            const converter = new ImportExecutionCucumberMultipartConverter(
                {
                    jira: {
                        projectKey: "CYP",
                        testExecutionIssueDetails: { subtask: false },
                    },
                    xray: { testEnvironments: ["DEV", "PROD"], uploadScreenshots: false },
                },
                false,
                jiraRepository
            );
            const multipartJson = await converter.convert([cucumberReport[0]], {
                browserName: "Firefox",
                browserVersion: "123.11.6",
                cypressVersion: "42.4.9",
                startedTestsAt: "2023-09-09T10:59:28.829Z",
            });
            expect(multipartJson.info.fields).to.have.deep.property("customfield_45678", [
                "DEV",
                "PROD",
            ]);
        });
    });

    describe("cloud", () => {
        it("converts cucumber JSON into Xray JSON", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const converter = new ImportExecutionCucumberMultipartConverter(
                {
                    jira: {
                        projectKey: "CYP",
                        testExecutionIssueDetails: { subtask: false, id: "issue_1578" },
                    },
                    cucumber: { prefixes: { test: "TestName:" } },
                    xray: { uploadScreenshots: false },
                },
                true,
                jiraRepository
            );
            const multipartJson = await converter.convert([cucumberReport[0]], {
                browserName: "Firefox",
                browserVersion: "123.11.6",
                cypressVersion: "42.4.9",
                startedTestsAt: "2023-09-09T10:59:28.829Z",
            });
            expect(multipartJson.features).to.be.an("array").with.length(1);
            expect(multipartJson.info).to.deep.eq({
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
                readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            jiraRepository.getFieldId
                .withArgs(SupportedField.TEST_PLAN)
                .resolves("customfield_12345");
            const converter = new ImportExecutionCucumberMultipartConverter(
                {
                    jira: {
                        projectKey: "CYP",
                        testPlanIssueKey: "CYP-123",
                        testExecutionIssueDetails: { subtask: false },
                    },
                    cucumber: { prefixes: { test: "TestName:" } },
                    xray: { uploadScreenshots: false },
                },
                true,
                jiraRepository
            );
            const multipartJson = await converter.convert([cucumberReport[0]], {
                browserName: "Firefox",
                browserVersion: "123.11.6",
                cypressVersion: "42.4.9",
                startedTestsAt: "2023-09-09T10:59:28.829Z",
            });
            expect(multipartJson.info).to.have.deep.property("xrayFields", {
                testPlanKey: "CYP-123",
                environments: undefined,
            });
        });

        it("includes configured test environments", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            jiraRepository.getFieldId
                .withArgs(SupportedField.TEST_ENVIRONMENTS)
                .resolves("customfield_45678");
            const converter = new ImportExecutionCucumberMultipartConverter(
                {
                    jira: {
                        projectKey: "CYP",
                        testExecutionIssueDetails: { subtask: false },
                    },
                    cucumber: { prefixes: { test: "TestName:" } },
                    xray: { testEnvironments: ["DEV", "PROD"], uploadScreenshots: false },
                },
                true,
                jiraRepository
            );
            const multipartJson = await converter.convert([cucumberReport[0]], {
                browserName: "Firefox",
                browserVersion: "123.11.6",
                cypressVersion: "42.4.9",
                startedTestsAt: "2023-09-09T10:59:28.829Z",
            });
            expect(multipartJson.info).to.have.deep.property("xrayFields", {
                testPlanKey: undefined,
                environments: ["DEV", "PROD"],
            });
        });
    });
});
