import assert from "node:assert";
import fs from "node:fs";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { runCypress } from "../../sh.mjs";

// ============================================================================================== //
// https://github.com/Qytera-Gmbh/cypress-xray-plugin/pull/339
// ============================================================================================== //

describe(relative(cwd(), import.meta.filename), { timeout: 180000 }, async () => {
    for (const test of [
        {
            logDirectory: join(import.meta.dirname, "server", "logs"),
            projectDirectory: join(import.meta.dirname, "cloud"),
            service: "cloud",
            title: "the cy.request task does not do anything if disabled (cloud)",
        },
        {
            logDirectory: join(import.meta.dirname, "server", "logs"),
            projectDirectory: join(import.meta.dirname, "server"),
            service: "server",
            title: "the cy.request task does not do anything if disabled (server)",
        },
    ] as const) {
        await it(test.title, () => {
            runCypress(test.projectDirectory, {
                includeDefaultEnv: test.service,
            });
            assert.strictEqual(fs.existsSync(test.logDirectory), false);
        });
    }
});
