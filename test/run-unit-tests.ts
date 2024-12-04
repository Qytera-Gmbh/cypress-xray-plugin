import { createWriteStream } from "node:fs";
import { resolve } from "node:path";
import { run } from "node:test";
import { junit, spec } from "node:test/reporters";
import { startServer, stopServer } from "./server";
import { getFiles } from "./util";

const SRC_DIR = resolve("src");

const TEST_STREAM = run({ files: getFiles(SRC_DIR, (name) => name.endsWith(".test.ts")) })
    .once("test:fail", () => {
        process.exitCode = 1;
    })
    .once("readable", () => {
        startServer();
    })
    .once("end", () => {
        stopServer();
    });

TEST_STREAM.compose(junit).pipe(createWriteStream("unit.xml", "utf-8"));
TEST_STREAM.pipe(spec()).pipe(process.stdout);
