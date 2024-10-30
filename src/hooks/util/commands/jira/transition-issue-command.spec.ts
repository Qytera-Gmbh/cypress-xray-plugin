import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { getMockedJiraClient, getMockedLogger } from "../../../../../test/mocks";
import { Level } from "../../../../util/logging";
import { ConstantCommand } from "../constant-command";
import { TransitionIssueCommand } from "./transition-issue-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(TransitionIssueCommand.name, () => {
        it("transitions issues", async () => {
            const logger = getMockedLogger();
            const jiraClient = getMockedJiraClient();
            jiraClient.transitionIssue.onFirstCall().resolves();
            const command = new TransitionIssueCommand(
                { jiraClient: jiraClient, transition: { id: "5" } },
                logger,
                new ConstantCommand(logger, "CYP-123")
            );
            await command.compute();
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Transitioning test execution issue CYP-123"
            );
            expect(jiraClient.transitionIssue).to.have.been.calledOnceWithExactly("CYP-123", {
                id: "5",
            });
        });
    });
});
