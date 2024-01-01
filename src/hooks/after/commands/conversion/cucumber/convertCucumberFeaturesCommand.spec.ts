import { expect } from "chai";
import fs from "fs";
import path from "path";
import { CucumberMultipartFeature } from "../../../../../types/xray/requests/importExecutionCucumberMultipart";
import { ConstantCommand } from "../../../../util";
import { ConvertCucumberFeaturesCommand } from "./convertCucumberFeaturesCommand";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ConvertCucumberFeaturesCommand.name, () => {
        it("converts cucumber results into cucumber features data", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberFeaturesCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    xray: { uploadScreenshots: false },
                },
                new ConstantCommand(cucumberReport.slice(0, 1))
            );
            const features = await command.compute();
            expect(features).to.be.an("array").with.length(1);
        });

        it("returns parameters", () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartServer.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberFeaturesCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    xray: { uploadScreenshots: false },
                },
                new ConstantCommand(cucumberReport.slice(0, 1))
            );
            expect(command.getParameters()).to.deep.eq({
                jira: {
                    projectKey: "CYP",
                },
                xray: { uploadScreenshots: false },
            });
        });

        it("converts cucumber results into cloud cucumber features data", async () => {
            const cucumberReport: CucumberMultipartFeature[] = JSON.parse(
                fs.readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                    "utf-8"
                )
            ) as CucumberMultipartFeature[];
            const command = new ConvertCucumberFeaturesCommand(
                {
                    jira: {
                        projectKey: "CYP",
                    },
                    cucumber: { prefixes: { test: "TestName:" } },
                    xray: { uploadScreenshots: false },
                    useCloudTags: true,
                },
                new ConstantCommand(cucumberReport.slice(0, 1))
            );
            const features = await command.compute();
            expect(features).to.be.an("array").with.length(1);
        });
    });
});
