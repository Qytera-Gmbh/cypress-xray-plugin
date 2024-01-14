import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import * as dependencies from "./dependencies";

// Enable promise assertions.
chai.use(chaiAsPromised);

describe("the optional dependency import", () => {
    it("throws if a package is not installed", async () => {
        await expect(
            dependencies.importOptionalDependency("nonexistent")
        ).to.eventually.be.rejectedWith(/Cannot find package 'nonexistent'/);
    });

    it("returns imported packages", async () => {
        const members = await dependencies.importOptionalDependency(
            "@badeball/cypress-cucumber-preprocessor"
        );
        expect(members).to.have.property("resolvePreprocessorConfiguration");
    });
});
