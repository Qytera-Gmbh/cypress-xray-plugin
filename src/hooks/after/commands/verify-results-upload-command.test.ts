import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "../../../util/dedent.js";
import { SkippedError } from "../../../util/errors.js";
import { Level, LOG } from "../../../util/logging.js";
import { ConstantCommand } from "../../util/commands/constant-command.js";
import { VerifyResultsUploadCommand } from "./verify-results-upload-command.js";

await describe(relative(cwd(), import.meta.filename), async () => {
    await describe(VerifyResultsUploadCommand.name, async () => {
        await it("prints a success message for successful cypress uploads", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const command = new VerifyResultsUploadCommand({ url: "https://example.org" }, LOG, {
                cucumberExecutionIssueKey: new ConstantCommand(LOG, undefined),
                cypressExecutionIssueKey: new ConstantCommand(LOG, "CYP-123"),
            });
            await command.compute();
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.SUCCESS,
                "Uploaded Cypress test results to issue: CYP-123 (https://example.org/browse/CYP-123)",
            ]);
        });

        await it("prints a success message for successful cucumber uploads", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const command = new VerifyResultsUploadCommand({ url: "https://example.org" }, LOG, {
                cucumberExecutionIssueKey: new ConstantCommand(LOG, "CYP-123"),
                cypressExecutionIssueKey: new ConstantCommand(LOG, undefined),
            });
            await command.compute();
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.SUCCESS,
                "Uploaded Cucumber test results to issue: CYP-123 (https://example.org/browse/CYP-123)",
            ]);
        });

        await it("prints a success message for successful uploads", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const command = new VerifyResultsUploadCommand({ url: "https://example.org" }, LOG, {
                cucumberExecutionIssueKey: new ConstantCommand(LOG, "CYP-123"),
                cypressExecutionIssueKey: new ConstantCommand(LOG, "CYP-123"),
            });
            await command.compute();
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.SUCCESS,
                "Uploaded test results to issue: CYP-123 (https://example.org/browse/CYP-123)",
            ]);
        });

        await it("skips for mismatched execution issue keys", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const command = new VerifyResultsUploadCommand({ url: "https://example.org" }, LOG, {
                cucumberExecutionIssueKey: new ConstantCommand(LOG, "CYP-456"),
                cypressExecutionIssueKey: new ConstantCommand(LOG, "CYP-123"),
            });
            await assert.rejects(
                command.compute(),
                SkippedError,
                dedent(`
                    Cucumber execution results were imported to a different test execution issue than the Cypress execution results:

                      Cypress  test execution issue: CYP-123 https://example.org/browse/CYP-123
                      Cucumber test execution issue: CYP-456 https://example.org/browse/CYP-456

                    Make sure your Jira configuration does not prevent modifications of existing test executions.
                `)
            );
        });

        await it("skips when there are no results", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const command = new VerifyResultsUploadCommand({ url: "https://example.org" }, LOG, {
                cucumberExecutionIssueKey: new ConstantCommand(LOG, undefined),
                cypressExecutionIssueKey: new ConstantCommand(LOG, undefined),
            });
            await assert.rejects(command.compute(), SkippedError, "No test results were uploaded");
        });
    });
});
