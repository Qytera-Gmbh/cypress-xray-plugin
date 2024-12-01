import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { LoggedError, errorMessage, isLoggedError } from "./errors.js";

await describe(relative(cwd(), import.meta.filename), async () => {
    await describe(errorMessage.name, async () => {
        await it("returns error messages", () => {
            assert.strictEqual(errorMessage(new Error("Hi")), "Hi");
        });

        await it("returns other objects as strings", () => {
            assert.strictEqual(errorMessage(15), "15");
        });
    });

    await describe(isLoggedError.name, async () => {
        await it("returns true for LoggedError", () => {
            assert.strictEqual(isLoggedError(new LoggedError()), true);
        });

        await it("returns false for Error", () => {
            assert.strictEqual(isLoggedError(new Error()), false);
        });
    });
});
