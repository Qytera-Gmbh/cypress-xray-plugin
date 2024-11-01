import { expect } from "chai";
import { describe, it } from "node:test";
import path from "path";
import { LoggedError, errorMessage, isLoggedError } from "./errors.js";

await describe(path.relative(process.cwd(), import.meta.filename), async async () => {
    await describe(errorMessage.name, async async () => {
        await it("returns error messages", () => {
            expect(errorMessage(new Error("Hi"))).to.eq("Hi");
        });

        await it("returns other objects as strings", () => {
            expect(errorMessage(15)).to.eq("15");
        });
    });

    await describe(isLoggedError.name, async async () => {
        await it("returns true for LoggedError", () => {
            expect(isLoggedError(new LoggedError())).to.be.true;
        });

        await it("returns false for Error", () => {
            expect(isLoggedError(new Error())).to.be.false;
        });
    });
});
