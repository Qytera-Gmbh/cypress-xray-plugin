import { createWriteStream } from "node:fs";
import { resolve } from "node:path";
import { run } from "node:test";
import { junit, spec } from "node:test/reporters";
import { initFaker } from "./faker";
import { startServer, stopServer } from "./server";
import { findFiles } from "./util";

const SRC_DIR = resolve("src");

const TEST_STREAM = run({
    concurrency: true,
    files: findFiles(SRC_DIR, (filepath) => filepath.endsWith(".spec.ts")),
    only: Boolean(process.env.ONLY ?? false),
})
    .once("test:fail", () => {
        process.exitCode = 1;
    })
    .once("readable", () => {
        initFaker();
        startServer();
    })
    .once("end", () => {
        stopServer();
    });

TEST_STREAM.compose(junit).pipe(createWriteStream("unit.xml", "utf-8"));
TEST_STREAM.pipe(spec()).pipe(process.stdout);
