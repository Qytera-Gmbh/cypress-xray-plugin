import { expect } from "chai";
import path from "path";
import { getMockedLogger, getMockedXrayClient } from "../../../../../test/mocks";
import { dedent } from "../../../../util/dedent";
import { Level } from "../../../../util/logging";
import { ImportFeatureCommand } from "./import-feature-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ImportFeatureCommand.name, () => {
        it("imports features", async () => {
            const logger = getMockedLogger();
            const xrayClient = getMockedXrayClient();
            const command = new ImportFeatureCommand(
                {
                    xrayClient: xrayClient,
                    filePath: "/path/to/some/cucumber.feature",
                },
                logger
            );
            xrayClient.importFeature.onFirstCall().resolves({
                errors: [],
                updatedOrCreatedIssues: ["CYP-123", "CYP-42"],
            });
            expect(await command.compute()).to.deep.eq({
                errors: [],
                updatedOrCreatedIssues: ["CYP-123", "CYP-42"],
            });
            expect(logger.message).to.have.been.calledWithExactly(
                Level.INFO,
                "Importing feature file to Xray: /path/to/some/cucumber.feature"
            );
        });

        it("warns about import errors", async () => {
            const logger = getMockedLogger();
            const xrayClient = getMockedXrayClient();
            const command = new ImportFeatureCommand(
                {
                    xrayClient: xrayClient,
                    filePath: "/path/to/some/cucumber.feature",
                },
                logger
            );
            xrayClient.importFeature.onFirstCall().resolves({
                errors: ["CYP-123 does not exist", "CYP-42: Access denied", "Big\nProblem"],
                updatedOrCreatedIssues: [],
            });
            await command.compute();
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Encountered errors during feature file import:
                    - CYP-123 does not exist
                    - CYP-42: Access denied
                    - Big\nProblem
                `)
            );
        });
    });
});
