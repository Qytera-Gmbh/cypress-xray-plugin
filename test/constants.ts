import fs from "fs";
import path from "path";

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
