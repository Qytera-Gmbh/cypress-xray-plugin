import { createWriteStream } from "node:fs";
import { resolve } from "node:path";
import { run } from "node:test";
import { junit, spec } from "node:test/reporters";
import { startServer, stopServer } from "./server";
import { findFiles } from "./util";

const INTEGRATION_DIR = resolve("test", "integration");

const TEST_STREAM = run({
    files: findFiles(INTEGRATION_DIR, (filepath: string) => filepath.endsWith(".spec.mts")),
})
    .once("test:fail", () => {
        process.exitCode = 1;
    })
    .once("readable", () => {
        startServer();
    })
    .once("end", () => {
        stopServer();
    });

TEST_STREAM.compose(junit).pipe(createWriteStream("integration.xml", "utf-8"));
TEST_STREAM.pipe(spec()).pipe(process.stdout);
