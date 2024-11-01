import { expect } from "chai";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { getMockedLogger } from "../../../../test/mocks.js";
import { ConstantCommand } from "../../util/commands/constant-command.js";
import { ExtractIssueKeysCommand } from "./extract-issue-keys-command.js";

await describe(relative(cwd(), import.meta.filename), async () => {
    await describe(ExtractIssueKeysCommand.name, async () => {
        await it("merges all issue keys into one array", async () => {
            const logger = getMockedLogger();
            const extractIssueKeysCommand = new ExtractIssueKeysCommand(
                logger,
                new ConstantCommand(logger, {
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
            expect(await extractIssueKeysCommand.compute()).to.deep.eq([
                "CYP-123",
                "CYP-456",
                "CYP-789",
                "CYP-001",
            ]);
        });
    });
});
