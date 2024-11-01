import { expect } from "chai";
import path from "path";
import { LoggedError, errorMessage, isLoggedError } from "./errors";

describe(path.relative(process.cwd(), __filename), () => {
    describe(errorMessage.name, () => {
        it("returns error messages", () => {
            expect(errorMessage(new Error("Hi"))).to.eq("Hi");
        });

        it("returns other objects as strings", () => {
            expect(errorMessage(15)).to.eq("15");
        });
    });

    describe(isLoggedError.name, () => {
        it("returns true for LoggedError", () => {
            expect(isLoggedError(new LoggedError())).to.be.true;
        });

        it("returns false for Error", () => {
            expect(isLoggedError(new Error())).to.be.false;
        });
    });
});
