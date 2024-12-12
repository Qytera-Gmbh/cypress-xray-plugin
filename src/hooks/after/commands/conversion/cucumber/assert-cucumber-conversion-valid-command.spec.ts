import assert from "node:assert";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import type {
    CucumberMultipart,
    CucumberMultipartFeature,
} from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import type { MultipartInfo } from "../../../../../types/xray/requests/import-execution-multipart-info";
import { LOG } from "../../../../../util/logging";
import { ConstantCommand } from "../../../../util/commands/constant-command";
import { AssertCucumberConversionValidCommand } from "./assert-cucumber-conversion-valid-command";

describe(relative(cwd(), __filename), async () => {
    await describe(AssertCucumberConversionValidCommand.name, async () => {
        await it("correctly verifies cucumber multipart data", async (context) => {
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
            const cucumberMultipart: CucumberMultipart = {
                features: cucumberFeatures,
                info: cucumberInfo,
            };
            const command = new AssertCucumberConversionValidCommand(
                LOG,
                new ConstantCommand(LOG, cucumberMultipart)
            );

            await assert.doesNotReject(command.compute());
        });

        await it("throws for empty feature arrays", async (context) => {
            context.mock.method(LOG, "message", context.mock.fn());
            const cucumberInfo: MultipartInfo = JSON.parse(
                readFileSync(
                    "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoServer.json",
                    "utf-8"
                )
            ) as MultipartInfo;
            const cucumberMultipart: CucumberMultipart = {
                features: [],
                info: cucumberInfo,
            };
            const command = new AssertCucumberConversionValidCommand(
                LOG,
                new ConstantCommand(LOG, cucumberMultipart)
            );

            await assert.rejects(command.compute(), {
                message: "Skipping Cucumber results upload: No Cucumber tests were executed",
            });
        });
    });
});
