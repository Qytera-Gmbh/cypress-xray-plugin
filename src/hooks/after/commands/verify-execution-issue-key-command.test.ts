import { expect } from "chai";
import { describe, it } from "node:test";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks.js";
import { dedent } from "../../../util/dedent.js";
import { Level } from "../../../util/logging.js";
import { ConstantCommand } from "../../util/commands/constant-command.js";
import { VerifyExecutionIssueKeyCommand } from "./verify-execution-issue-key-command.js";

await describe(path.relative(process.cwd(), import.meta.filename), () => {
    await describe(VerifyExecutionIssueKeyCommand.name, () => {
        await it("verifies without warning", async () => {
            const logger = getMockedLogger();
            const command = new VerifyExecutionIssueKeyCommand(
                {
                    displayCloudHelp: false,
                    importType: "cypress",
                    testExecutionIssueKey: "CYP-123",
                    testExecutionIssueType: { name: "Test Execution" },
                },
                logger,
                new ConstantCommand(logger, "CYP-123")
            );
            await command.compute();
            expect(logger.message).to.not.have.been.called;
        });

        await it("prints a warning for cypress import failures", async () => {
            const logger = getMockedLogger();
            const command = new VerifyExecutionIssueKeyCommand(
                {
                    displayCloudHelp: true,
                    importType: "cypress",
                    testExecutionIssueKey: "CYP-123",
                    testExecutionIssueType: { name: "Test Execution" },
                },
                logger,
                new ConstantCommand(logger, "CYP-456")
            );
            await command.compute();
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Cypress execution results were imported to test execution CYP-456, which is different from the configured one: CYP-123

                    Make sure issue CYP-123 actually exists and is of type: {
                      "name": "Test Execution"
                    }

                    More information
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#issuetype
                    - https://docs.getxray.app/display/XRAYCLOUD/Project+Settings%3A+Issue+Types+Mapping
                `)
            );
        });

        await it("prints a warning for cucumber import failures", async () => {
            const logger = getMockedLogger();
            const command = new VerifyExecutionIssueKeyCommand(
                {
                    displayCloudHelp: false,
                    importType: "cucumber",
                    testExecutionIssueKey: "CYP-123",
                    testExecutionIssueType: { name: "Test Execution" },
                },
                logger,
                new ConstantCommand(logger, "CYP-456")
            );
            await command.compute();
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Cucumber execution results were imported to test execution CYP-456, which is different from the configured one: CYP-123

                    Make sure issue CYP-123 actually exists and is of type: {
                      "name": "Test Execution"
                    }

                    More information
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#issuetype
                    - https://docs.getxray.app/display/XRAY/Configuring+a+Jira+project+to+be+used+as+an+Xray+Test+Project
                `)
            );
        });
    });
});
