import { expect } from "chai";
import path from "path";

describe(path.relative(process.cwd(), __filename), () => {
    // Make sure there are no accidental breaking changes for the plugin's exported members.
    // If there were, the compiler would complain about these tests.
    // These tests therefore somewhat simulate a real use case.
    it("configureXrayPlugin", () => {
        const configureXrayPlugin = eval("require('./index').configureXrayPlugin;") as unknown;
        expect(configureXrayPlugin).to.be.a("function");
    });

    it("syncFeatureFile", () => {
        const syncFeatureFile = eval("require('./index').syncFeatureFile;") as unknown;
        expect(syncFeatureFile).to.be.a("function");
    });
});
