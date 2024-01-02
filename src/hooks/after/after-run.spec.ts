import { expect } from "chai";
import path from "path";
import { addUploadCommands } from "./after-run";

describe(path.relative(process.cwd(), __filename), () => {
    describe(addUploadCommands.name, () => {
        it("TODO", () => {
            expect(true).to.be.true;
        });
    });
});
