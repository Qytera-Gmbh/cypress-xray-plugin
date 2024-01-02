import { expect } from "chai";
import fs from "fs";
import path from "path";
import { CypressRunResultType } from "../../../types/cypress/run-result";
import { ConstantCommand } from "../../util/commands/constant-command";
import { ExtractVideoFilesCommand } from "./extract-video-files-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ExtractVideoFilesCommand.name, () => {
        it("extracts video files", async () => {
            const runResults = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ExtractVideoFilesCommand(new ConstantCommand(runResults));
            expect(await command.compute()).to.deep.eq([
                "~/repositories/xray/cypress/videos/example.cy.ts.mp4",
            ]);
        });

        it("skips null paths", async () => {
            const runResults = JSON.parse(
                fs.readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
            ) as CypressRunResultType;
            const command = new ExtractVideoFilesCommand(new ConstantCommand(runResults));
            expect(await command.compute()).to.deep.eq([]);
        });
    });
});
