import axios from "axios";
import assert from "node:assert";
import fs from "node:fs";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { PatCredentials } from "../../../../client/authentication/credentials.js";
import { AxiosRestClient } from "../../../../client/https/https.js";
import { ServerClient } from "../../../../client/xray/xray-client-server.js";
import type { XrayClient } from "../../../../client/xray/xray-client.js";
import type { CucumberMultipartFeature } from "../../../../types/xray/requests/import-execution-cucumber-multipart.js";
import type { MultipartInfo } from "../../../../types/xray/requests/import-execution-multipart-info.js";
import { LOG } from "../../../../util/logging.js";
import { ConstantCommand } from "../constant-command.js";
import { ImportExecutionCucumberCommand } from "./import-execution-cucumber-command.js";

await describe(relative(cwd(), import.meta.filename), async () => {
    await describe(ImportExecutionCucumberCommand.name, async () => {
        await it("imports cucumber multipart", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const xrayClient = new ServerClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
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
            context.mock.method(
                xrayClient,
                "importExecutionCucumberMultipart",
                context.mock.fn<XrayClient["importExecutionCucumberMultipart"]>(
                    (cucumberJson, cucumberInfo) => {
                        if (
                            cucumberJson === multipart.features &&
                            cucumberInfo === multipart.info
                        ) {
                            return Promise.resolve("CYP-123");
                        }
                        return Promise.reject(new Error("Mock called unexpectedly"));
                    }
                )
            );
            const command = new ImportExecutionCucumberCommand(
                {
                    xrayClient: xrayClient,
                },
                LOG,
                new ConstantCommand(LOG, multipart)
            );
            assert.strictEqual(await command.compute(), "CYP-123");
            assert.strictEqual(message.mock.callCount(), 0);
        });
    });
});
