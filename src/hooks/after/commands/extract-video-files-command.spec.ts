import assert from "node:assert";
import fs from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import type { CypressRunResult } from "../../../types/cypress";
import { LOG } from "../../../util/logging";
import { ConstantCommand } from "../../util/commands/constant-command";
import { ExtractVideoFilesCommand } from "./extract-video-files-command";

describe(relative(cwd(), __filename), async () => {
    await describe(ExtractVideoFilesCommand.name, async () => {
        await it("extracts video files", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const runResults = JSON.parse(
                fs.readFileSync("./test/resources/runResult.json", "utf-8")
            ) as CypressRunResult<"<13">;
            const command = new ExtractVideoFilesCommand(LOG, new ConstantCommand(LOG, runResults));
            assert.deepStrictEqual(await command.compute(), [
                "~/repositories/xray/cypress/videos/example.cy.ts.mp4",
            ]);
        });

        await it("skips null paths", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const runResults = JSON.parse(
                fs.readFileSync("./test/resources/runResult_13_0_0.json", "utf-8")
            ) as CypressRunResult<"13" | "14">;
            const command = new ExtractVideoFilesCommand(LOG, new ConstantCommand(LOG, runResults));
            assert.deepStrictEqual(await command.compute(), []);
        });
    });
});
