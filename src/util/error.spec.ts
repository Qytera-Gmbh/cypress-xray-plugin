import { expect } from "chai";
import { errorMessage } from "./error";

describe("errorMessage", () => {
    it("returns error messages", () => {
        expect(errorMessage(new Error("Hi"))).to.eq("Hi");
    });

    it("returns other objects as strings", () => {
        expect(errorMessage(15)).to.eq("15");
    });
});
