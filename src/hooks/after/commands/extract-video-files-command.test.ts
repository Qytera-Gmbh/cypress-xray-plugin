import { expect } from "chai";
import fs from "fs";
import { describe, it } from "node:test";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks.js";
import type { CypressRunResultType } from "../../../types/cypress/cypress.js";
import { ConstantCommand } from "../../util/commands/constant-command.js";
import { ExtractVideoFilesCommand } from "./extract-video-files-command.js";

await describe(path.relative(process.cwd(), import.meta.filename), async () => {
    await describe(ExtractVideoFilesCommand.name, async async () => {
        await it("extracts video files", async () => {
            const logger = getMockedLogger();
            const runResults = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ExtractVideoFilesCommand(
                logger,
                new ConstantCommand(logger, runResults)
            );
            expect(await command.compute()).to.deep.eq([
                "~/repositories/xray/cypress/videos/example.cy.ts.mp4",
            ]);
        });

        await it("skips null paths", async () => {
            const logger = getMockedLogger();
            const runResults = JSON.parse(
                fs.readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ExtractVideoFilesCommand(
                logger,
                new ConstantCommand(logger, runResults)
            );
            expect(await command.compute()).to.deep.eq([]);
        });
    });
});
