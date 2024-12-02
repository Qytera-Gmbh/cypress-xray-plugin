import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { LOG } from "../../../util/logging";
import { ConstantCommand } from "../../util/commands/constant-command";
import { ExtractIssueKeysCommand } from "./extract-issue-keys-command";

describe(relative(cwd(), __filename), async () => {
    await describe(ExtractIssueKeysCommand.name, async () => {
        await it("merges all issue keys into one array", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const extractIssueKeysCommand = new ExtractIssueKeysCommand(
                LOG,
                new ConstantCommand(LOG, {
                    preconditions: [{ key: "CYP-001", summary: "Background" }],
                    tests: [
                        { key: "CYP-123", summary: "Hello", tags: [] },
                        { key: "CYP-456", summary: "There", tags: ["some tag"] },
                        {
                            key: "CYP-789",
                            summary: "Guys",
                            tags: ["another tag", "and another one"],
                        },
                    ],
                })
            );
            assert.deepStrictEqual(await extractIssueKeysCommand.compute(), [
                "CYP-123",
                "CYP-456",
                "CYP-789",
                "CYP-001",
            ]);
        });
    });
});
