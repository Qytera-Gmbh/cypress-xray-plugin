import { expect } from "chai";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks";
import { Level } from "../../../util/logging";
import { ConstantCommand } from "../../util/commands/constant-command";
import { PrintUploadSuccessCommand } from "./print-upload-success-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(PrintUploadSuccessCommand.name, () => {
        it("prints a success message", async () => {
            const logger = getMockedLogger();
            const command = new PrintUploadSuccessCommand(
                { url: "https://example.org" },
                new ConstantCommand("CYP-123")
            );
            await command.compute();
            expect(logger.message).to.have.been.calledWithExactly(
                Level.SUCCESS,
                "Uploaded test results to issue: CYP-123 (https://example.org/browse/CYP-123)"
            );
        });
    });
});
