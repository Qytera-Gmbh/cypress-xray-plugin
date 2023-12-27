import { expect } from "chai";
import { getMockedLogger, getMockedXrayClient } from "../../../test/mocks";
import { Level } from "../../logging/logging";
import { dedent } from "../../util/dedent";
import { ImportFeatureCommand } from "./importFeatureCommand";

describe(__filename, () => {
    describe(ImportFeatureCommand.name, () => {
        it("warns about import errors", async () => {
            const logger = getMockedLogger();
            const xrayClient = getMockedXrayClient();
            const importFeatureCommand = new ImportFeatureCommand(xrayClient, {
                file: "/path/to/some/cucumber.feature",
            });
            xrayClient.importFeature.onFirstCall().resolves({
                errors: ["CYP-123 does not exist", "CYP-42: Access denied", "Big\nProblem"],
                updatedOrCreatedIssues: [],
            });
            await importFeatureCommand.compute();
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
