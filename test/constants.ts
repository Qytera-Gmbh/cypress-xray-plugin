import fs from "fs";
import path from "path";
import Sinon, { stub } from "sinon";
import sinonChai from "sinon-chai";

import chai from "chai";

import * as logging from "../src/logging/logging";

chai.use(sinonChai);

export const stubLogInfo = () => stub(logging, "logInfo");
export const stubOnLogError = () => stub(logging, "logError");
export const stubLogSuccess = () => stub(logging, "logSuccess");
export const stubLogWarning = () => stub(logging, "logWarning");
export const stubLogDebug = () => stub(logging, "logDebug");

afterEach(() => {
    Sinon.restore();
});

const TEST_TMP_DIR = "test/out";

export function getTestDir(dirName: string): string {
    return path.join(TEST_TMP_DIR, dirName);
}

// Clean up temporary directory at the end of all tests.
after(async () => {
    if (fs.existsSync(TEST_TMP_DIR)) {
        fs.rmSync(TEST_TMP_DIR, { recursive: true });
    }
});
