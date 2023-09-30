import { expect } from "chai";
import { LoggedError, errorMessage, isLoggedError } from "./error";

describe("errorMessage", () => {
    it("returns error messages", () => {
        expect(errorMessage(new Error("Hi"))).to.eq("Hi");
    });

    it("returns other objects as strings", () => {
        expect(errorMessage(15)).to.eq("15");
    });
});

describe("isLoggedError", () => {
    it("returns true for LoggedError", () => {
        expect(isLoggedError(new LoggedError())).to.be.true;
    });

    it("returns false for Error", () => {
        expect(isLoggedError(new Error())).to.be.false;
    });
});
