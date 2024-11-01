import { expect } from "chai";
import fs from "fs";
import { describe, it } from "node:test";
import { relative } from "path";
import { getMockedLogger } from "../../../../../../test/mocks.js";
import type { CucumberMultipartFeature } from "../../../../../types/xray/requests/import-execution-cucumber-multipart.js";
import type { MultipartInfo } from "../../../../../types/xray/requests/import-execution-multipart-info.js";
import { ConstantCommand } from "../../../../util/commands/constant-command.js";
import { CombineCucumberMultipartCommand } from "./combine-cucumber-multipart-command.js";

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await describe(CombineCucumberMultipartCommand.name, async () => {
        await it("combines cucumber multipart data", async () => {
            const logger = getMockedLogger();
            const cucumberFeatures: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const cucumberInfo: MultipartInfo = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoServer.json",
                    "utf-8"
                )
            ) as MultipartInfo;
            const command = new CombineCucumberMultipartCommand(
                logger,
                new ConstantCommand(logger, cucumberInfo),
                new ConstantCommand(logger, cucumberFeatures)
            );
            expect(await command.compute()).to.deep.eq({
                features: cucumberFeatures,
                info: cucumberInfo,
            });
        });
    });
});
