import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "node:path";
import { getMockedJiraClient, getMockedLogger } from "../../../../../test/mocks";
import { dedent } from "../../../../util/dedent";
import { Level } from "../../../../util/logging";
import { ConstantCommand } from "../constant-command";
import { EditIssueFieldCommand } from "./edit-issue-field-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(EditIssueFieldCommand.name, () => {
        it("edits issues", async () => {
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

        it("logs errors for unsuccessful edits", async () => {
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

        it("returns empty arrays", async () => {
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
