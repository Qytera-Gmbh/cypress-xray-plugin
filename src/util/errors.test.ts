import { expect } from "chai";
import path from "path";
import { LoggedError, errorMessage, isLoggedError } from "./errors.js";

await describe(path.relative(process.cwd(), import.meta.filename), () => {
    await describe(errorMessage.name, () => {
        await it("returns error messages", () => {
            expect(errorMessage(new Error("Hi"))).to.eq("Hi");
        });

        await it("returns other objects as strings", () => {
            expect(errorMessage(15)).to.eq("15");
        });
    });

    await describe(isLoggedError.name, () => {
        await it("returns true for LoggedError", () => {
            expect(isLoggedError(new LoggedError())).to.be.true;
        });

        await it("returns false for Error", () => {
            expect(isLoggedError(new Error())).to.be.false;
        });
    });
});
