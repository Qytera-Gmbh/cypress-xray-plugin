import { expect } from "chai";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks";
import { dedent } from "../../../util/dedent";
import { Level } from "../../../util/logging";
import { ConstantCommand } from "../../util/commands/constant-command";
import { GetUpdatedIssuesCommand } from "./get-updated-issues-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(GetUpdatedIssuesCommand.name, () => {
        it("returns all affected issues", async () => {
            const command = new GetUpdatedIssuesCommand(
                new ConstantCommand(["CYP-123", "CYP-456", "CYP-789", "CYP-001"]),
                new ConstantCommand({
                    errors: [],
                    updatedOrCreatedIssues: ["CYP-123", "CYP-456", "CYP-789", "CYP-001"],
                })
            );
            expect(await command.compute()).to.deep.eq([
                "CYP-123",
                "CYP-456",
                "CYP-789",
                "CYP-001",
            ]);
        });
    });

    it("warns about issues not updated by Jira", async () => {
        const command = new GetUpdatedIssuesCommand(
            new ConstantCommand(["CYP-123", "CYP-756"]),
            new ConstantCommand({
                errors: [],
                updatedOrCreatedIssues: [],
            })
        );
        const logger = getMockedLogger();
        expect(await command.compute()).to.deep.eq([]);
        expect(logger.message).to.have.been.calledWithExactly(
            Level.WARNING,
            dedent(`
                Mismatch between feature file issue tags and updated Jira issues detected

                Issues contained in feature file tags which were not updated by Jira and might not exist:
                  CYP-123
                  CYP-756

                Make sure that:
                - All issues present in feature file tags belong to existing issues
                - Your plugin tag prefix settings are consistent with the ones defined in Xray

                More information:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
            `)
        );
    });

    it("warns about unknown issues updated by Jira", async () => {
        const command = new GetUpdatedIssuesCommand(
            new ConstantCommand([]),
            new ConstantCommand({
                errors: [],
                updatedOrCreatedIssues: ["CYP-123", "CYP-756"],
            })
        );
        const logger = getMockedLogger();
        expect(await command.compute()).to.deep.eq([]);
        expect(logger.message).to.have.been.calledWithExactly(
            Level.WARNING,
            dedent(`
                Mismatch between feature file issue tags and updated Jira issues detected

                Issues updated by Jira which are not present in feature file tags and might have been created:
                  CYP-123
                  CYP-756

                Make sure that:
                - All issues present in feature file tags belong to existing issues
                - Your plugin tag prefix settings are consistent with the ones defined in Xray

                More information:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
            `)
        );
    });

    it("warns about issue key mismatches", async () => {
        const command = new GetUpdatedIssuesCommand(
            new ConstantCommand(["CYP-123", "CYP-756", "CYP-42"]),
            new ConstantCommand({
                errors: [],
                updatedOrCreatedIssues: ["CYP-536", "CYP-552", "CYP-756"],
            })
        );
        const logger = getMockedLogger();
        expect(await command.compute()).to.deep.eq(["CYP-756"]);
        expect(logger.message).to.have.been.calledWithExactly(
            Level.WARNING,
            dedent(`
                Mismatch between feature file issue tags and updated Jira issues detected

                Issues contained in feature file tags which were not updated by Jira and might not exist:
                  CYP-123
                  CYP-42

                Issues updated by Jira which are not present in feature file tags and might have been created:
                  CYP-536
                  CYP-552

                Make sure that:
                - All issues present in feature file tags belong to existing issues
                - Your plugin tag prefix settings are consistent with the ones defined in Xray

                More information:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
            `)
        );
    });
});
