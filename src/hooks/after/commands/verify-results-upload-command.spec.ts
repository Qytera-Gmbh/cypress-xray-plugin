import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks";
import { dedent } from "../../../util/dedent";
import { SkippedError } from "../../../util/errors";
import { Level } from "../../../util/logging";
import { ConstantCommand } from "../../util/commands/constant-command";
import { VerifyResultsUploadCommand } from "./verify-results-upload-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(VerifyResultsUploadCommand.name, () => {
        it("prints a success message for successful cypress uploads", async () => {
            const logger = getMockedLogger();
            const command = new VerifyResultsUploadCommand({ url: "https://example.org" }, logger, {
                cypressExecutionIssueKey: new ConstantCommand(logger, "CYP-123"),
                cucumberExecutionIssueKey: new ConstantCommand(logger, undefined),
            });
            await command.compute();
            expect(logger.message).to.have.been.calledWithExactly(
                Level.SUCCESS,
                "Uploaded Cypress test results to issue: CYP-123 (https://example.org/browse/CYP-123)"
            );
        });

        it("prints a success message for successful cucumber uploads", async () => {
            const logger = getMockedLogger();
            const command = new VerifyResultsUploadCommand({ url: "https://example.org" }, logger, {
                cypressExecutionIssueKey: new ConstantCommand(logger, undefined),
                cucumberExecutionIssueKey: new ConstantCommand(logger, "CYP-123"),
            });
            await command.compute();
            expect(logger.message).to.have.been.calledWithExactly(
                Level.SUCCESS,
                "Uploaded Cucumber test results to issue: CYP-123 (https://example.org/browse/CYP-123)"
            );
        });

        it("prints a success message for successful uploads", async () => {
            const logger = getMockedLogger();
            const command = new VerifyResultsUploadCommand({ url: "https://example.org" }, logger, {
                cypressExecutionIssueKey: new ConstantCommand(logger, "CYP-123"),
                cucumberExecutionIssueKey: new ConstantCommand(logger, "CYP-123"),
            });
            await command.compute();
            expect(logger.message).to.have.been.calledWithExactly(
                Level.SUCCESS,
                "Uploaded test results to issue: CYP-123 (https://example.org/browse/CYP-123)"
            );
        });

        it("skips for mismatched execution issue keys", async () => {
            const logger = getMockedLogger();
            const command = new VerifyResultsUploadCommand({ url: "https://example.org" }, logger, {
                cypressExecutionIssueKey: new ConstantCommand(logger, "CYP-123"),
                cucumberExecutionIssueKey: new ConstantCommand(logger, "CYP-456"),
            });
            await expect(command.compute())
                .to.eventually.be.an.instanceOf(SkippedError)
                .and.to.eventually.be.rejectedWith(
                    dedent(`
                        Cucumber execution results were imported to a different test execution issue than the Cypress execution results
                          Cypress test execution issue:  CYP-123 https://example.org/browse/CYP-123
                          Cucumber test execution issue: CYP-456 https://example.org/browse/CYP-456

                        Make sure your Jira configuration does not prevent modifications of existing test executions
                    `)
                );
        });

        it("skips when there are no results", async () => {
            const logger = getMockedLogger();
            const command = new VerifyResultsUploadCommand({ url: "https://example.org" }, logger, {
                cypressExecutionIssueKey: new ConstantCommand(logger, undefined),
                cucumberExecutionIssueKey: new ConstantCommand(logger, undefined),
            });
            await expect(command.compute())
                .to.eventually.be.an.instanceOf(SkippedError)
                .and.to.eventually.be.rejectedWith("No test results were uploaded");
        });
    });
});
