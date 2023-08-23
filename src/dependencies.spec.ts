import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import * as dependencies from "./dependencies";

// Enable promise assertions.
chai.use(chaiAsPromised);

describe("the optional dependency import", () => {
    it("throws if a package is not installed 2", async () => {
        await expect(dependencies.importModule("nonexistent")).to.eventually.be.rejectedWith(
            /Cannot find module 'nonexistent'/
        );
    });

    it("returns imported packages", async () => {
        const members = await dependencies.importOptionalDependency("axios");
        expect(members).to.haveOwnProperty("get");
        expect(members).to.haveOwnProperty("post");
        expect(members).to.haveOwnProperty("put");
        expect(members).to.haveOwnProperty("delete");
    });
});
