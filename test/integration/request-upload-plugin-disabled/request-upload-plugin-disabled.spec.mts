import assert from "node:assert";
import fs from "node:fs";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { runCypress } from "../../sh.mjs";
import { shouldRunIntegrationTests } from "../util.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/pull/339
// ============================================================================================== //

void describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, () => {
    if (shouldRunIntegrationTests("cloud")) {
        for (const test of [
            {
                logDirectory: join(import.meta.dirname, "server", "logs"),
                projectDirectory: join(import.meta.dirname, "cloud"),
                title: "the cy.request task does not do anything if disabled (cloud)",
            },
        ] as const) {
            void it(test.title, () => {
                runCypress(test.projectDirectory, {
                    includeDefaultEnv: "cloud",
                });
                assert.strictEqual(fs.existsSync(test.logDirectory), false);
            });
        }
    }

    if (shouldRunIntegrationTests("server")) {
        for (const test of [
            {
                logDirectory: join(import.meta.dirname, "server", "logs"),
                projectDirectory: join(import.meta.dirname, "server"),
                title: "the cy.request task does not do anything if disabled (server)",
            },
        ] as const) {
            void it(test.title, () => {
                runCypress(test.projectDirectory, {
                    includeDefaultEnv: "server",
                });
                assert.strictEqual(fs.existsSync(test.logDirectory), false);
            });
        }
    }
});
