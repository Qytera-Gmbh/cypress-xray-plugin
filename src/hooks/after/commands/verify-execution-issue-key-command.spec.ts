import { expect } from "chai";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks";
import { dedent } from "../../../util/dedent";
import { Level } from "../../../util/logging";
import { ConstantCommand } from "../../util/commands/constant-command";
import { VerifyExecutionIssueKeyCommand } from "./verify-execution-issue-key-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(VerifyExecutionIssueKeyCommand.name, () => {
        it("verifies without warning", async () => {
            const logger = getMockedLogger();
            const command = new VerifyExecutionIssueKeyCommand(
                {
                    displayCloudHelp: false,
                    importType: "cypress",
                    testExecutionIssueKey: "CYP-123",
                    testExecutionIssueType: "Test Execution",
                },
                logger,
                new ConstantCommand(logger, "CYP-123")
            );
            await command.compute();
            expect(logger.message).to.not.have.been.called;
        });

        it("prints a warning for cypress import failures", async () => {
            const logger = getMockedLogger();
            const command = new VerifyExecutionIssueKeyCommand(
                {
                    displayCloudHelp: true,
                    importType: "cypress",
                    testExecutionIssueKey: "CYP-123",
                    testExecutionIssueType: "Test Execution",
                },
                logger,
                new ConstantCommand(logger, "CYP-456")
            );
            await command.compute();
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Cypress execution results were imported to test execution CYP-456, which is different from the configured one: CYP-123

                    Make sure issue CYP-123 actually exists and is of type: Test Execution

                    More information
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testExecutionIssueType
                    - https://docs.getxray.app/display/XRAYCLOUD/Project+Settings%3A+Issue+Types+Mapping
                `)
            );
        });

        it("prints a warning for cucumber import failures", async () => {
            const logger = getMockedLogger();
            const command = new VerifyExecutionIssueKeyCommand(
                {
                    displayCloudHelp: false,
                    importType: "cucumber",
                    testExecutionIssueKey: "CYP-123",
                    testExecutionIssueType: "Test Execution",
                },
                logger,
                new ConstantCommand(logger, "CYP-456")
            );
            await command.compute();
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Cucumber execution results were imported to test execution CYP-456, which is different from the configured one: CYP-123

                    Make sure issue CYP-123 actually exists and is of type: Test Execution

                    More information
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#testExecutionIssueType
                    - https://docs.getxray.app/display/XRAY/Configuring+a+Jira+project+to+be+used+as+an+Xray+Test+Project
                `)
            );
        });
    });
});
