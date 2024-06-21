import { expect } from "chai";
import fs from "fs";
import path from "path";
import { getMockedLogger } from "../../../../../../test/mocks";
import { CucumberMultipartFeature } from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import { CucumberMultipartInfo } from "../../../../../types/xray/requests/import-execution-cucumber-multipart-info";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { CombineCucumberMultipartCommand } from "./combine-cucumber-multipart-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(CombineCucumberMultipartCommand.name, () => {
        it("combines cucumber multipart data", async () => {
            const logger = getMockedLogger();
            const cucumberFeatures: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const cucumberInfo: CucumberMultipartInfo = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartInfo;
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
