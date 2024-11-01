import { expect } from "chai";
import fs from "fs";
import { describe, it } from "node:test";
import { relative } from "path";
import { getMockedLogger, getMockedXrayClient } from "../../../../../test/mocks.js";
import type { CucumberMultipartFeature } from "../../../../types/xray/requests/import-execution-cucumber-multipart.js";
import type { MultipartInfo } from "../../../../types/xray/requests/import-execution-multipart-info.js";
import { ConstantCommand } from "../constant-command.js";
import { ImportExecutionCucumberCommand } from "./import-execution-cucumber-command.js";

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await describe(ImportExecutionCucumberCommand.name, async () => {
        await it("imports cucumber multipart", async () => {
            const logger = getMockedLogger();
            const xrayClient = getMockedXrayClient();
            const multipart = {
                features: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartCloud.json",
                        "utf-8"
                    )
                ) as CucumberMultipartFeature[],
                info: JSON.parse(
                    fs.readFileSync(
                        "./test/resources/fixtures/xray/requests/importExecutionCucumberMultipartInfoCloud.json",
                        "utf-8"
                    )
                ) as MultipartInfo,
            };
            const command = new ImportExecutionCucumberCommand(
                {
                    xrayClient: xrayClient,
                },
                logger,
                new ConstantCommand(logger, multipart)
            );
            xrayClient.importExecutionCucumberMultipart
                .withArgs(multipart.features, multipart.info)
                .resolves("CYP-123");
            expect(await command.compute()).to.eq("CYP-123");
            expect(logger.message).to.not.have.been.called;
        });
    });
});
