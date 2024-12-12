import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "../../../util/dedent";
import { Level, LOG } from "../../../util/logging";
import { ConstantCommand } from "../../util/commands/constant-command";
import { VerifyExecutionIssueKeyCommand } from "./verify-execution-issue-key-command";

describe(relative(cwd(), __filename), async () => {
    await describe(VerifyExecutionIssueKeyCommand.name, async () => {
        await it("verifies without warning", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const command = new VerifyExecutionIssueKeyCommand(
                {
                    displayCloudHelp: false,
                    importType: "cypress",
                    testExecutionIssueKey: "CYP-123",
                    testExecutionIssueType: { name: "Test Execution" },
                },
                LOG,
                new ConstantCommand(LOG, "CYP-123")
            );
            await command.compute();
            assert.strictEqual(message.mock.callCount(), 0);
        });

        await it("prints a warning for cypress import failures", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const command = new VerifyExecutionIssueKeyCommand(
                {
                    displayCloudHelp: true,
                    importType: "cypress",
                    testExecutionIssueKey: "CYP-123",
                    testExecutionIssueType: { name: "Test Execution" },
                },
                LOG,
                new ConstantCommand(LOG, "CYP-456")
            );
            await command.compute();
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.WARNING,
                dedent(`
                    Cypress execution results were imported to test execution CYP-456, which is different from the configured one: CYP-123

                    Make sure issue CYP-123 actually exists and is of type: {
                      "name": "Test Execution"
                    }

                    More information
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#issuetype
                    - https://docs.getxray.app/display/XRAYCLOUD/Project+Settings%3A+Issue+Types+Mapping
                `),
            ]);
        });

        await it("prints a warning for cucumber import failures", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const command = new VerifyExecutionIssueKeyCommand(
                {
                    displayCloudHelp: false,
                    importType: "cucumber",
                    testExecutionIssueKey: "CYP-123",
                    testExecutionIssueType: { name: "Test Execution" },
                },
                LOG,
                new ConstantCommand(LOG, "CYP-456")
            );
            await command.compute();
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.WARNING,
                dedent(`
                    Cucumber execution results were imported to test execution CYP-456, which is different from the configured one: CYP-123

                    Make sure issue CYP-123 actually exists and is of type: {
                      "name": "Test Execution"
                    }

                    More information
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#issuetype
                    - https://docs.getxray.app/display/XRAY/Configuring+a+Jira+project+to+be+used+as+an+Xray+Test+Project
                `),
            ]);
        });
    });
});
