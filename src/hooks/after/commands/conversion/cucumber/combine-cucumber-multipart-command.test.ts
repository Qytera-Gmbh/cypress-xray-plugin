import assert from "node:assert";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import type { CucumberMultipartFeature } from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import type { MultipartInfo } from "../../../../../types/xray/requests/import-execution-multipart-info";
import { LOG } from "../../../../../util/logging";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { CombineCucumberMultipartCommand } from "./combine-cucumber-multipart-command";

describe(relative(cwd(), __filename), async () => {
    await describe(CombineCucumberMultipartCommand.name, async () => {
        await it("combines cucumber multipart data", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const cucumberFeatures: CucumberMultipartFeature[] = JSON.parse(
                readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const cucumberInfo: MultipartInfo = JSON.parse(
                readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoServer.json",
                    "utf-8"
                )
            ) as MultipartInfo;
            const command = new CombineCucumberMultipartCommand(
                LOG,
                new ConstantCommand(LOG, cucumberInfo),
                new ConstantCommand(LOG, cucumberFeatures)
            );
            assert.deepStrictEqual(await command.compute(), {
                features: cucumberFeatures,
                info: cucumberInfo,
            });
        });
    });
});
