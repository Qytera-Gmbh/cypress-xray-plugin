#!/usr/bin/env node

"use strict";

import chalk from "chalk";
import fs from "fs";
import http from "http";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

void yargs(hideBin(process.argv))
    .strict()
    .options({
        file: {
            type: "string",
            describe: "The execution file to load",
        },
        port: {
            alias: "p",
            type: "number",
            describe: "The port to bind on",
            default: 3000,
        },
        verbose: {
            alias: "v",
            type: "boolean",
            describe: "Run with verbose logging",
        },
    })
    .scriptName("")
    .command(
        "show-execution [file]",
        "start the interactive execution viewer",
        (builder) => {
            builder.positional("file", {
                type: "string",
                describe: "The execution file to load",
            });
        },
        (argv) => {
            const htmlPath = path.resolve(__dirname, "index.html");
            const server = http.createServer((req, res) => {
                if (argv.verbose) {
                    console.log(`    ${chalk.yellow(req.method)} ${req.url}`);
                }
                res.writeHead(200, { ["content-type"]: "text/html" });
                fs.createReadStream(htmlPath).pipe(res);
            });

            const port = process.env.PORT ?? argv.port;
            server.listen(port);

            const query = argv.file ? `?file=${encodeURIComponent(argv.file)}` : "";

            console.log(
                [
                    "",
                    "Serving plugin execution graph at:",
                    "",
                    `    ${chalk.green(`http://127.0.0.1:${port}${query}`)}`,
                    "",
                    `Press ${chalk.cyan("CTRL-C")} to stop the server`,
                    "",
                ].join("\n")
            );
        }
    )
    .demandCommand(1, "")
    .usage("\nUsage: cypress-xray-plugin <command>")
    .parse();
