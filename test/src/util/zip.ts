import { unzip } from "../../../src/util/zip";

import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import fs from "fs";
import path from "path";
import { getTestDir } from "../../constants";

// Enable promise assertions.
chai.use(chaiAsPromised);

const ZIP_DIRECTORY = getTestDir("zip");

describe("the zipping utility", () => {
    it("should be able to unzip a zip file including the .zip extension", async () => {
        await unzip("./test/resources/compressedContent.zip", ZIP_DIRECTORY);
        expect(fs.existsSync(`${ZIP_DIRECTORY}/content.txt`)).to.be.true;
        expect(fs.existsSync(`${ZIP_DIRECTORY}/content/compressed.txt`)).to.be.true;
    });

    it("should not be able to overwrite existing files", async () => {
        const zipFilePath = ["test", "resources", "compressedContent.zip"];
        const existingFilePath = ["test", "resources", "compressedContent"];
        const absolutePath = path.resolve(...zipFilePath);
        const absoluteErrorPath = path.resolve(...existingFilePath);
        await expect(unzip(absolutePath)).to.eventually.be.rejectedWith(
            `EEXIST: file already exists, mkdir '${absoluteErrorPath}'`
        );
    });
});
