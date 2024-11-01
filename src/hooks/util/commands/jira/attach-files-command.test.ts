import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { describe, it } from "node:test";
import { relative } from "path";
import { getMockedJiraClient, getMockedLogger } from "../../../../../test/mocks.js";
import { Level } from "../../../../util/logging.js";
import { ConstantCommand } from "../constant-command.js";
import { AttachFilesCommand } from "./attach-files-command.js";

chai.use(chaiAsPromised);

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await describe(AttachFilesCommand.name, async () => {
        await it("attaches files", async () => {
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

        await it("does not throw without files to attach", async () => {
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
