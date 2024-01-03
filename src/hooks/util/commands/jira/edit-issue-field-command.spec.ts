import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { getMockedJiraClient, getMockedLogger } from "../../../../../test/mocks";
import { Level } from "../../../../util/logging";
import { ConstantCommand } from "../constant-command";
import { EditIssueFieldCommand } from "./edit-issue-field-command";
import { JiraField } from "./extract-field-id-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(EditIssueFieldCommand.name, () => {
        it("edits issues", async () => {
            const jiraClient = getMockedJiraClient();
            const logger = getMockedLogger();
            jiraClient.editIssue
                .withArgs("CYP-123", { fields: { ["customfield_12345"]: "hello" } })
                .resolves("CYP-123");
            jiraClient.editIssue
                .withArgs("CYP-456", { fields: { ["customfield_12345"]: "there" } })
                .resolves("CYP-456");
            const command = new EditIssueFieldCommand(
                {
                    jiraClient: jiraClient,
                    field: JiraField.SUMMARY,
                },
                new ConstantCommand("customfield_12345"),
                new ConstantCommand({ ["CYP-123"]: "hello", ["CYP-456"]: "there" })
            );
            expect(await command.compute()).to.deep.eq(["CYP-123", "CYP-456"]);
            expect(logger.message).to.not.have.been.called;
        });

        it("logs errors for unsuccessful edits", async () => {
            const jiraClient = getMockedJiraClient();
            const logger = getMockedLogger();
            jiraClient.editIssue
                .withArgs("CYP-123", { fields: { ["customfield_12345"]: ["dev", "test"] } })
                .resolves("CYP-123");
            jiraClient.editIssue
                .withArgs("CYP-456", { fields: { ["customfield_12345"]: ["test"] } })
                .rejects(new Error("No editing allowed"));
            const command = new EditIssueFieldCommand(
                {
                    jiraClient: jiraClient,
                    field: JiraField.LABELS,
                },
                new ConstantCommand("customfield_12345"),
                new ConstantCommand({ ["CYP-123"]: ["dev", "test"], ["CYP-456"]: ["test"] })
            );
            expect(await command.compute()).to.deep.eq(["CYP-123"]);
            expect(logger.message).to.have.been.calledWithExactly(
                Level.ERROR,
                'Failed to set labels field of issue CYP-456 to value: ["test"]'
            );
        });

        it("returns empty arrays", async () => {
            const jiraClient = getMockedJiraClient();
            const logger = getMockedLogger();
            const command = new EditIssueFieldCommand(
                {
                    jiraClient: jiraClient,
                    field: JiraField.LABELS,
                },
                new ConstantCommand("customfield_12345"),
                new ConstantCommand({})
            );
            expect(await command.compute()).to.deep.eq([]);
            expect(logger.message).to.not.have.been.called;
        });
    });
});
