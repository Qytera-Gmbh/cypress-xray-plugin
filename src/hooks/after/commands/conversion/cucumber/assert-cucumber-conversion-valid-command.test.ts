import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import fs from "fs";
import path from "path";
import { getMockedLogger } from "../../../../../../test/mocks.js";
import type {
    CucumberMultipart,
    CucumberMultipartFeature,
} from "../../../../../types/xray/requests/import-execution-cucumber-multipart.js";
import type { MultipartInfo } from "../../../../../types/xray/requests/import-execution-multipart-info.js";
import { ConstantCommand } from "../../../../util/commands/constant-command.js";
import { AssertCucumberConversionValidCommand } from "./assert-cucumber-conversion-valid-command.js";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), import.meta.filename), () => {
    describe(AssertCucumberConversionValidCommand.name, () => {
        it("correctly verifies cucumber multipart data", async () => {
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
            const cucumberMultipart: CucumberMultipart = {
                features: cucumberFeatures,
                info: cucumberInfo,
            };
            const command = new AssertCucumberConversionValidCommand(
                logger,
                new ConstantCommand(logger, cucumberMultipart)
            );
            await expect(command.compute()).to.not.be.rejected;
        });

        it("throws for empty feature arrays", async () => {
            const logger = getMockedLogger();
            const cucumberInfo: MultipartInfo = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoServer.json",
                    "utf-8"
                )
            ) as MultipartInfo;
            const cucumberMultipart: CucumberMultipart = {
                features: [],
                info: cucumberInfo,
            };
            const command = new AssertCucumberConversionValidCommand(
                logger,
                new ConstantCommand(logger, cucumberMultipart)
            );
            await expect(command.compute()).to.be.rejectedWith(
                "Skipping Cucumber results upload: No Cucumber tests were executed"
            );
        });
    });
});
