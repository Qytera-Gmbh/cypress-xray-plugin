import assert from "node:assert";
import path from "node:path";
import process from "node:process";
import { beforeEach, describe, it } from "node:test";
import { getMockedCypress } from "../../test/mocks";

void describe(path.relative(process.cwd(), __filename), () => {
    beforeEach(() => {
        const resolved = require.resolve(`${__dirname}/commands`);
        if (resolved in require.cache) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete require.cache[resolved];
        }
    });

    void it("overwrites the cy.request command on import", async (context) => {
        const overwriteSpy = context.mock.fn((name: string) => {
            assert.strictEqual(name, "request");
        });
        getMockedCypress().cypress.Commands.overwrite = overwriteSpy;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        await require("./commands");
        assert.strictEqual(overwriteSpy.mock.callCount(), 1);
    });
});
