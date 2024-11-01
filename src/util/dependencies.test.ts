import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { describe, it } from "node:test";
import path from "path";
import * as dependencies from "./dependencies.js";

// Enable promise assertions.
chai.use(chaiAsPromised);

await describe(path.relative(process.cwd(), import.meta.filename), async async () => {
    await it("throws if a package is not installed", async () => {
        await expect(
            dependencies.importOptionalDependency("nonexistent")
        ).to.eventually.be.rejectedWith(/Cannot find module 'nonexistent'/);
    });

    await it("imports @badeball/cypress-cucumber-preprocessor", async () => {
        const members = await dependencies.importOptionalDependency(
            "@badeball/cypress-cucumber-preprocessor"
        );
        expect(members).to.have.property("resolvePreprocessorConfiguration");
    });
});
