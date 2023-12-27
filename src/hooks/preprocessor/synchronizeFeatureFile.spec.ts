import { expect } from "chai";
import path from "path";
import { synchronizeFeatureFile } from "./synchronizeFeatureFile";

describe(path.relative(process.cwd(), __filename), () => {
    describe(synchronizeFeatureFile.name, () => {
        it("TODO", () => {
            expect(true).to.be.true;
        });
    });
});
