import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { describe, it } from "node:test";
import path from "path";
import { getMockedJiraClient, getMockedLogger } from "../../../../../test/mocks.js";
import { dedent } from "../../../../util/dedent.js";
import { Level } from "../../../../util/logging.js";
import { ConstantCommand } from "../constant-command.js";
import { EditIssueFieldCommand } from "./edit-issue-field-command.js";

chai.use(chaiAsPromised);

await describe(path.relative(process.cwd(), import.meta.filename), async () => {
    await describe(EditIssueFieldCommand.name, async async async () => {
        await it("edits issues", async () => {
            const logger = getMockedLogger();
            const jiraClient = getMockedJiraClient();
            jiraClient.editIssue
                .withArgs("CYP-123", { fields: { ["customfield_12345"]: "hello" } })
                .resolves("CYP-123");
            jiraClient.editIssue
                .withArgs("CYP-456", { fields: { ["customfield_12345"]: "there" } })
                .resolves("CYP-456");
            const command = new EditIssueFieldCommand(
                {
                    fieldId: "summary",
                    jiraClient: jiraClient,
                },
                logger,
                new ConstantCommand(logger, "customfield_12345"),
                new ConstantCommand(logger, {
                    ["CYP-123"]: "hello",
                    ["CYP-456"]: "there",
                })
            );
            expect(await command.compute()).to.deep.eq(["CYP-123", "CYP-456"]);
            expect(logger.message).to.not.have.been.called;
        });

        await it("logs errors for unsuccessful edits", async () => {
            const logger = getMockedLogger();
            const jiraClient = getMockedJiraClient();
            jiraClient.editIssue
                .withArgs("CYP-123", { fields: { ["customfield_12345"]: ["dev", "test"] } })
                .resolves("CYP-123");
            jiraClient.editIssue
                .withArgs("CYP-456", { fields: { ["customfield_12345"]: ["test"] } })
                .rejects(new Error("No editing allowed"));
            const command = new EditIssueFieldCommand(
                {
                    fieldId: "labels",
                    jiraClient: jiraClient,
                },
                logger,
                new ConstantCommand(logger, "customfield_12345"),
                new ConstantCommand(logger, {
                    ["CYP-123"]: ["dev", "test"],
                    ["CYP-456"]: ["test"],
                })
            );
            expect(await command.compute()).to.deep.eq(["CYP-123"]);
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    CYP-456

                      Failed to set labels field to value: ["test"]
                `)
            );
        });

        await it("returns empty arrays", async () => {
            const logger = getMockedLogger();
            const jiraClient = getMockedJiraClient();
            const command = new EditIssueFieldCommand(
                {
                    fieldId: "labels",
                    jiraClient: jiraClient,
                },
                logger,
                new ConstantCommand(logger, "customfield_12345"),
                new ConstantCommand(logger, {})
            );
            expect(await command.compute()).to.deep.eq([]);
            expect(logger.message).to.not.have.been.called;
        });
    });
});
