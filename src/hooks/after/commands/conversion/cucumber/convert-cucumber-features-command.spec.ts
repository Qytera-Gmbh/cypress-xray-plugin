import { expect } from "chai";
import fs from "fs";
import path from "path";
import { getMockedLogger } from "../../../../../../test/mocks";
import { CucumberMultipartFeature } from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { ConvertCucumberFeaturesCommand } from "./convert-cucumber-features-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ConvertCucumberFeaturesCommand.name, () => {
        it("converts cucumber results into cucumber features data", async () => {
            const logger = getMockedLogger();
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { precondition: undefined, test: undefined } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    xray: { uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, cucumberReport.slice(0, 1))
            );
            const features = await command.compute();
            expect(features).to.be.an("array").with.length(1);
        });

        it("returns parameters", () => {
            const logger = getMockedLogger();
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { precondition: undefined, test: undefined } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    xray: { uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, cucumberReport.slice(0, 1))
            );
            expect(command.getParameters()).to.deep.eq({
                cucumber: {
                    prefixes: {
                        precondition: undefined,
                        test: undefined,
                    },
                },
                jira: {
                    projectKey: "CYP",
                },
                projectRoot: "./test/resources",
                xray: { uploadScreenshots: false },
            });
        });

        it("converts cucumber results into cloud cucumber features data", async () => {
            const logger = getMockedLogger();
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberFeaturesCommand(
                {
                    cucumber: { prefixes: { test: "TestName:" } },
                    jira: {
                        projectKey: "CYP",
                    },
                    projectRoot: "./test/resources",
                    useCloudTags: true,
                    xray: { uploadScreenshots: false },
                },
                logger,
                new ConstantCommand(logger, cucumberReport.slice(0, 1))
            );
            const features = await command.compute();
            expect(features).to.be.an("array").with.length(1);
        });
    });
});
