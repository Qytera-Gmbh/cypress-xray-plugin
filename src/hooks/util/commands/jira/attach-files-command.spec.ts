import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { getMockedJiraClient, getMockedLogger } from "../../../../../test/mocks";
import { Level } from "../../../../util/logging";
import { ConstantCommand } from "../constant-command";
import { AttachFilesCommand } from "./attach-files-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(AttachFilesCommand.name, () => {
        it("attaches files", async () => {
            const jiraClient = getMockedJiraClient();
            const logger = getMockedLogger();
            jiraClient.addAttachment.withArgs("CYP-123", "image.jpg", "something.mp4").resolves([
                { filename: "image.jpg", size: 12345 },
                { filename: "something.mp4", size: 54321 },
            ]);
            const command = new AttachFilesCommand(
                { jiraClient: jiraClient },
                new ConstantCommand(["image.jpg", "something.mp4"]),
                new ConstantCommand("CYP-123")
            );
            expect(await command.compute()).to.deep.eq([
                { filename: "image.jpg", size: 12345 },
                { filename: "something.mp4", size: 54321 },
            ]);
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Attaching files to test execution issue CYP-123"
            );
        });

        it("throws without files to attach", async () => {
            const jiraClient = getMockedJiraClient();
            const command = new AttachFilesCommand(
                { jiraClient: jiraClient },
                new ConstantCommand([]),
                new ConstantCommand("CYP-123")
            );
            await expect(command.compute()).to.eventually.be.rejectedWith(
                "Skipping attaching files to test execution issue CYP-123: No files to attach"
            );
            expect(jiraClient.addAttachment).to.not.have.been.called;
        });
    });
});
