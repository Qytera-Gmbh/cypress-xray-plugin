import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import * as dependencies from "./dependencies.js";

// Enable promise assertions.
chai.use(chaiAsPromised);

describe(path.relative(process.cwd(), import.meta.filename), () => {
    it("throws if a package is not installed", async () => {
        await expect(
            dependencies.importOptionalDependency("nonexistent")
        ).to.eventually.be.rejectedWith(/Cannot find module 'nonexistent'/);
    });

    it("imports @badeball/cypress-cucumber-preprocessor", async () => {
        const members = await dependencies.importOptionalDependency(
            "@badeball/cypress-cucumber-preprocessor"
        );
        expect(members).to.have.property("resolvePreprocessorConfiguration");
    });
});
