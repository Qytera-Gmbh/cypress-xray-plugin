import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { LoggedError, errorMessage, isLoggedError } from "./errors";

void describe(relative(cwd(), __filename), () => {
    void describe(errorMessage.name, () => {
        void it("returns error messages", () => {
            assert.strictEqual(errorMessage(new Error("Hi")), "Hi");
        });

        void it("returns other objects as strings", () => {
            assert.strictEqual(errorMessage(15), "15");
        });
    });

    void describe(isLoggedError.name, () => {
        void it("returns true for LoggedError", () => {
            assert.strictEqual(isLoggedError(new LoggedError()), true);
        });

        void it("returns false for Error", () => {
            assert.strictEqual(isLoggedError(new Error()), false);
        });
    });
});
