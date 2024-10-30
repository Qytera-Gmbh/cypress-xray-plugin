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
            const logger = getMockedLogger();
            const jiraClient = getMockedJiraClient();
            jiraClient.addAttachment.withArgs("CYP-123", "image.jpg", "something.mp4").resolves([
                { filename: "image.jpg", size: 12345 },
                { filename: "something.mp4", size: 54321 },
            ]);
            const command = new AttachFilesCommand(
                { jiraClient: jiraClient },
                logger,
                new ConstantCommand(logger, ["image.jpg", "something.mp4"]),
                new ConstantCommand(logger, "CYP-123")
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

        it("does not throw without files to attach", async () => {
            const logger = getMockedLogger();
            const jiraClient = getMockedJiraClient();
            const command = new AttachFilesCommand(
                { jiraClient: jiraClient },
                logger,
                new ConstantCommand(logger, []),
                new ConstantCommand(logger, "CYP-123")
            );
            expect(await command.compute()).to.deep.eq([]);
            expect(jiraClient.addAttachment).to.not.have.been.called;
        });
    });
});
