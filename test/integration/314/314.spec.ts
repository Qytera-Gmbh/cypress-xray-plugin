import ansiColors from "ansi-colors";
import assert from "node:assert";
import fs from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";
import { describe, it } from "node:test";
import type { LoggedRequest } from "../../../src/client/https/requests";
import { runCypress } from "../../sh";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/314
// ============================================================================================== //

describe(relative(process.cwd(), __filename), () => {
    for (const test of [
        {
            logDirectory: join(__dirname, "automatic-cloud", "logs"),
            projectDirectory: join(__dirname, "automatic-cloud"),
            service: "cloud",
            title: "cy.request gets overwritten (cloud)",
        },
        {
            logDirectory: join(__dirname, "automatic-server", "logs"),
            projectDirectory: join(__dirname, "automatic-server"),
            service: "server",
            title: "cy.request gets overwritten (server)",
        },
        {
            logDirectory: join(__dirname, "manual-cloud", "logs"),
            projectDirectory: join(__dirname, "manual-cloud"),
            service: "cloud",
            title: "cy.request gets overwritten using manual task calls (cloud)",
        },
        {
            logDirectory: join(__dirname, "manual-server", "logs"),
            projectDirectory: join(__dirname, "manual-server"),
            service: "server",
            title: "cy.request gets overwritten using manual task calls (server)",
        },
    ] as const) {
        it(test.title, () => {
            runCypress(test.projectDirectory, {
                includeDefaultEnv: test.service,
            });
            for (const entry of fs.readdirSync(test.logDirectory, {
                withFileTypes: true,
            })) {
                // 14_15_52_POST_https_xray.cloud.getxray.app_api_v2_import_execution_multipart_request.json
                if (!/.+_POST_.+_import_execution_multipart_request.json/.exec(entry.name)) {
                    continue;
                }
                const fileContent = JSON.parse(
                    fs.readFileSync(join(entry.parentPath, entry.name), "utf8")
                ) as LoggedRequest;
                assert.strictEqual(
                    (fileContent.body as string).includes(
                        '"evidence":[{"contentType":"application/json","data":"ImxvY2FsaG9zdDo4MDgwIg=="'
                    ),
                    true
                );
                return;
            }
            assert.fail(
                `Expected to find a logged import execution request in log directory ${ansiColors.red(
                    test.logDirectory
                )}, but did not find any`
            );
        });
    }
});
