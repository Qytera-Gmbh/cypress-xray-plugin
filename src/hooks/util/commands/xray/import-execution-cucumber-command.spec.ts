import { expect } from "chai";
import fs from "fs";
import path from "path";
import { getMockedLogger, getMockedXrayClient } from "../../../../../test/mocks";
import type { CucumberMultipartFeature } from "../../../../types/xray/requests/import-execution-cucumber-multipart";
import type { MultipartInfo } from "../../../../types/xray/requests/import-execution-multipart-info";
import { ConstantCommand } from "../constant-command";
import { ImportExecutionCucumberCommand } from "./import-execution-cucumber-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(ImportExecutionCucumberCommand.name, () => {
        it("imports cucumber multipart", async () => {
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
