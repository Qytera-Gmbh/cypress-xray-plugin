import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { dedent } from "../../../util/dedent";
import { Level, LOG } from "../../../util/logging";
import { ConstantCommand } from "../../util/commands/constant-command";
import { GetUpdatedIssuesCommand } from "./get-updated-issues-command";

describe(relative(cwd(), __filename), async () => {
    await describe(GetUpdatedIssuesCommand.name, async () => {
        await it("returns all affected issues", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const command = new GetUpdatedIssuesCommand(
                { filePath: "~/home/test/some.feature" },
                LOG,
                new ConstantCommand(LOG, ["CYP-123", "CYP-456", "CYP-789", "CYP-001"]),
                new ConstantCommand(LOG, {
                    errors: [],
                    updatedOrCreatedIssues: ["CYP-123", "CYP-456", "CYP-789", "CYP-001"],
                })
            );
            assert.deepStrictEqual(await command.compute(), [
                "CYP-123",
                "CYP-456",
                "CYP-789",
                "CYP-001",
            ]);
        });
    });

    await it("warns about issues not updated by xray", async (context) => {
        const message = context.mock.method(LOG, "message", context.mock.fn());
        const command = new GetUpdatedIssuesCommand(
            { filePath: "~/home/test/some.feature" },
            LOG,
            new ConstantCommand(LOG, ["CYP-123", "CYP-756"]),
            new ConstantCommand(LOG, {
                errors: [],
                updatedOrCreatedIssues: [],
            })
        );
        assert.deepStrictEqual(await command.compute(), []);
        assert.deepStrictEqual(message.mock.calls[0].arguments, [
            Level.WARNING,
            dedent(`
                ~/home/test/some.feature

                  Mismatch between feature file issue tags and updated Jira issues detected.

                    Issues contained in feature file tags that have not been updated by Xray and may not exist:

                      CYP-123
                      CYP-756

                  Make sure that:
                  - All issues present in feature file tags belong to existing issues.
                  - Your plugin tag prefix settings match those defined in Xray.

                  More information:
                  - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                  - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
            `),
        ]);
    });

    await it("warns about unknown issues updated by xray", async (context) => {
        const message = context.mock.method(LOG, "message", context.mock.fn());
        const command = new GetUpdatedIssuesCommand(
            { filePath: "~/home/test/some.feature" },
            LOG,
            new ConstantCommand(LOG, []),
            new ConstantCommand(LOG, {
                errors: [],
                updatedOrCreatedIssues: ["CYP-123", "CYP-756"],
            })
        );
        assert.deepStrictEqual(await command.compute(), []);
        assert.deepStrictEqual(message.mock.calls[0].arguments, [
            Level.WARNING,
            dedent(`
                ~/home/test/some.feature

                  Mismatch between feature file issue tags and updated Jira issues detected.

                    Issues updated by Xray that do not exist in feature file tags and may have been created:

                      CYP-123
                      CYP-756

                  Make sure that:
                  - All issues present in feature file tags belong to existing issues.
                  - Your plugin tag prefix settings match those defined in Xray.

                  More information:
                  - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                  - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
            `),
        ]);
    });

    await it("warns about issue key mismatches", async (context) => {
        const message = context.mock.method(LOG, "message", context.mock.fn());
        const command = new GetUpdatedIssuesCommand(
            { filePath: "~/home/test/some.feature" },
            LOG,
            new ConstantCommand(LOG, ["CYP-123", "CYP-756", "CYP-42"]),
            new ConstantCommand(LOG, {
                errors: [],
                updatedOrCreatedIssues: ["CYP-536", "CYP-552", "CYP-756"],
            })
        );
        assert.deepStrictEqual(await command.compute(), ["CYP-756"]);
        assert.deepStrictEqual(message.mock.calls[0].arguments, [
            Level.WARNING,
            dedent(`
                ~/home/test/some.feature

                  Mismatch between feature file issue tags and updated Jira issues detected.

                    Issues contained in feature file tags that have not been updated by Xray and may not exist:

                      CYP-123
                      CYP-42

                    Issues updated by Xray that do not exist in feature file tags and may have been created:

                      CYP-536
                      CYP-552

                  Make sure that:
                  - All issues present in feature file tags belong to existing issues.
                  - Your plugin tag prefix settings match those defined in Xray.

                  More information:
                  - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                  - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
            `),
        ]);
    });
});
