import { expect } from "chai";
import path from "path";
import { ConstantCommand } from "../../util/commands/constantCommand";
import { ExtractIssueKeysCommand } from "./extractIssueKeysCommand";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ExtractIssueKeysCommand.name, () => {
        it("merges all issue keys into one array", async () => {
            const extractIssueKeysCommand = new ExtractIssueKeysCommand(
                new ConstantCommand({
                    tests: [
                        { key: "CYP-123", summary: "Hello", tags: [] },
                        { key: "CYP-456", summary: "There", tags: ["some tag"] },
                        {
                            key: "CYP-789",
                            summary: "Guys",
                            tags: ["another tag", "and another one"],
                        },
                    ],
                    preconditions: [{ key: "CYP-001", summary: "Background" }],
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
