import { expect } from "chai";
import { readFileSync } from "fs";
import path from "path";
import {
    initJiraOptions,
    initPluginOptions,
    initSslOptions,
    initXrayOptions,
} from "../../../../../context";
import { InternalCypressXrayPluginOptions } from "../../../../../types/plugin";
import { dedent } from "../../../../../util/dedent";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { ConvertCypressInfoCommand } from "./convert-cypress-info-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ConvertCypressInfoCommand.name, () => {
        let options: InternalCypressXrayPluginOptions;

        beforeEach(() => {
            options = {
                jira: initJiraOptions(
                    {},
                    {
                        projectKey: "CYP",
                        url: "https://example.org",
                    }
                ),
                xray: initXrayOptions(
                    {},
                    {
                        uploadResults: true,
                    }
                ),
                plugin: initPluginOptions({}, {}),
                ssl: initSslOptions({}, {}),
            };
        });

        it("converts test results into xray info json", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const command = new ConvertCypressInfoCommand(options, new ConstantCommand(result));
            const json = await command.compute();
            expect(json).to.deep.eq({
                description: "Cypress version: 11.1.0\nBrowser: electron (106.0.5249.51)",
                finishDate: "2022-11-28T17:41:19Z",
                project: "CYP",
                startDate: "2022-11-28T17:41:12Z",
                summary: "Execution Results [1669657272234]",
                testEnvironments: undefined,
                testPlanKey: undefined,
            });
        });

        it("erases milliseconds from timestamps", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const command = new ConvertCypressInfoCommand(options, new ConstantCommand(result));
            const info = await command.compute();
            expect(info.startDate).to.eq("2022-11-28T17:41:12Z");
            expect(info.finishDate).to.eq("2022-11-28T17:41:19Z");
        });

        it("adds test plan issue keys", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            options.jira.testPlanIssueKey = "CYP-123";
            const command = new ConvertCypressInfoCommand(options, new ConstantCommand(result));
            const info = await command.compute();
            expect(info.testPlanKey).to.eq("CYP-123");
        });

        it("does not add test plan issue keys on its own", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const command = new ConvertCypressInfoCommand(options, new ConstantCommand(result));
            const info = await command.compute();
            expect(info.testPlanKey).to.be.undefined;
        });

        it("includes a custom test execution summary if provided", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            options.jira.testExecutionIssueSummary = "Jeffrey's Test";
            const command = new ConvertCypressInfoCommand(options, new ConstantCommand(result));
            const info = await command.compute();
            expect(info.summary).to.eq("Jeffrey's Test");
        });

        it("uses a timestamp as test execution summary by default", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const command = new ConvertCypressInfoCommand(options, new ConstantCommand(result));
            const info = await command.compute();
            expect(info.summary).to.eq("Execution Results [1669657272234]");
        });

        it("does not add the default test execution summary if omitted and a key is given", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            options.jira.testExecutionIssueKey = "CYP-100";
            const command = new ConvertCypressInfoCommand(options, new ConstantCommand(result));
            const info = await command.compute();
            expect(info.summary).to.be.undefined;
        });

        it("includes a custom test execution description if provided", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            options.jira.testExecutionIssueDescription = "Very Useful Text";
            const command = new ConvertCypressInfoCommand(options, new ConstantCommand(result));
            const info = await command.compute();
            expect(info.description).to.eq("Very Useful Text");
        });

        it("uses versions as test execution description by default", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const command = new ConvertCypressInfoCommand(options, new ConstantCommand(result));
            const info = await command.compute();
            expect(info.description).to.eq(
                dedent(`
                    Cypress version: 11.1.0
                    Browser: electron (106.0.5249.51)
                `)
            );
        });

        it("does not add the default test execution description if omitted and a key is given", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            options.jira.testExecutionIssueKey = "CYP-100";
            const command = new ConvertCypressInfoCommand(options, new ConstantCommand(result));
            const info = await command.compute();
            expect(info.description).to.be.undefined;
        });

        it("includes test environments", async () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            options.xray.testEnvironments = ["DEV"];
            const command = new ConvertCypressInfoCommand(options, new ConstantCommand(result));
            const info = await command.compute();
            expect(info.testEnvironments).to.deep.eq(["DEV"]);
        });

        it("returns its parameters", () => {
            const result: CypressCommandLine.CypressRunResult = JSON.parse(
                readFileSync("./test/resources/runResultExistingTestIssues.json", "utf-8")
            ) as CypressCommandLine.CypressRunResult;
            const command = new ConvertCypressInfoCommand(
                {
                    jira: {
                        projectKey: "CYP",
                        testExecutionIssueKey: "CYP-123",
                        testExecutionIssueDescription: "desription",
                        testExecutionIssueSummary: "summary",
                        testPlanIssueKey: "CYP-456",
                    },
                    xray: {
                        testEnvironments: ["DEV"],
                    },
                },
                new ConstantCommand(result)
            );
            expect(command.getParameters()).to.deep.eq({
                jira: {
                    projectKey: "CYP",
                    testExecutionIssueKey: "CYP-123",
                    testExecutionIssueDescription: "desription",
                    testExecutionIssueSummary: "summary",
                    testPlanIssueKey: "CYP-456",
                },
                xray: {
                    testEnvironments: ["DEV"],
                },
            });
        });
    });
});
