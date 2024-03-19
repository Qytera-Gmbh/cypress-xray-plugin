import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import fs from "fs";
import path from "path";
import {
    CucumberMultipart,
    CucumberMultipartFeature,
} from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import { CucumberMultipartInfo } from "../../../../../types/xray/requests/import-execution-cucumber-multipart-info";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { AssertCucumberConversionValidCommand } from "./assert-cucumber-conversion-valid-command";

chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), __filename), () => {
    describe(AssertCucumberConversionValidCommand.name, () => {
        it("correctly verifies cucumber multipart data", async () => {
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
            const cucumberMultipart: CucumberMultipart = {
                info: cucumberInfo,
                features: cucumberFeatures,
            };
            const command = new AssertCucumberConversionValidCommand(
                new ConstantCommand(cucumberMultipart)
            );
            await expect(command.compute()).to.not.be.rejected;
        });

        it("throws for empty feature arrays", async () => {
            const cucumberInfo: CucumberMultipartInfo = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartInfo;
            const cucumberMultipart: CucumberMultipart = {
                info: cucumberInfo,
                features: [],
            };
            const command = new AssertCucumberConversionValidCommand(
                new ConstantCommand(cucumberMultipart)
            );
            await expect(command.compute()).to.be.rejectedWith(
                "Skipping Cucumber results upload: No Cucumber tests were executed"
            );
        });
    });
});
