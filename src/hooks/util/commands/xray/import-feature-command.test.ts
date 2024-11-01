import { expect } from "chai";
import { describe, it } from "node:test";
import { relative } from "path";
import { getMockedLogger, getMockedXrayClient } from "../../../../../test/mocks.js";
import { dedent } from "../../../../util/dedent.js";
import { Level } from "../../../../util/logging.js";
import { ImportFeatureCommand } from "./import-feature-command.js";

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await describe(ImportFeatureCommand.name, async () => {
        await it("imports features", async () => {
            const logger = getMockedLogger();
            const xrayClient = getMockedXrayClient();
            const command = new ImportFeatureCommand(
                {
                    filePath: "/path/to/some/cucumber.feature",
                    xrayClient: xrayClient,
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

        await it("warns about import errors", async () => {
            const logger = getMockedLogger();
            const xrayClient = getMockedXrayClient();
            const command = new ImportFeatureCommand(
                {
                    filePath: "/path/to/some/cucumber.feature",
                    xrayClient: xrayClient,
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
                    /path/to/some/cucumber.feature

                      Encountered errors during feature file import:
                      - CYP-123 does not exist
                      - CYP-42: Access denied
                      - Big\nProblem
                `)
            );
        });
    });
});
