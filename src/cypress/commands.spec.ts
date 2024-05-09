import chalk from "chalk";
import * as childProcess from "child_process";
import fs from "fs";
import path from "path";
import process from "process";
import { resolveTestDirPath } from "../../test/util";
import { dedent } from "../util/dedent";

const TEST_DIRECTORY = resolveTestDirPath("cypress");
const TEST_DIRECTORY_SUPPORT = path.join(TEST_DIRECTORY, "cypress", "support");
const TEST_FILENAME = "testfile.cy.js";
const TEST_FILE = path.join(TEST_DIRECTORY, TEST_FILENAME);
const CYPRESS_EXECUTABLE = path.join(__dirname, "..", "..", "node_modules", ".bin", "cypress");

const CONFIG_FILE = dedent(`
    const { defineConfig } = require("cypress");
    const { configureXrayPlugin } = require("cypress-xray-plugin");

    async function setupNodeEvents(on, config) {
        await configureXrayPlugin(on, config, {
            jira: {
                url: "https://example.org",
                projectKey: "CYP"
            },
            plugin: {
                debug: true
            }
        });
        return config;
    }

    module.exports = defineConfig({
        e2e: {
            specPattern: "${TEST_FILENAME}",
            setupNodeEvents
        },
    });
`);

const E2E_FILE = dedent(`
    import './commands';
`);

const SUPPORT_FILE = dedent(`
    import "cypress-xray-plugin/commands";
`);

describe(path.relative(process.cwd(), __filename), () => {
    before(() => {
        fs.rmSync(TEST_DIRECTORY, { recursive: true, force: true });
        fs.mkdirSync(TEST_DIRECTORY, { recursive: true });
        fs.writeFileSync(path.join(TEST_DIRECTORY, "cypress.config.js"), CONFIG_FILE);

        fs.mkdirSync(TEST_DIRECTORY_SUPPORT, { recursive: true });
        fs.writeFileSync(path.join(TEST_DIRECTORY_SUPPORT, "commands.js"), SUPPORT_FILE);
        fs.writeFileSync(path.join(TEST_DIRECTORY_SUPPORT, "e2e.js"), E2E_FILE);

        fs.mkdirSync(path.join(TEST_DIRECTORY, "node_modules"), { recursive: true });
        for (const entry of fs.readdirSync(path.join(__dirname, "..", "..", "node_modules"), {
            withFileTypes: true,
        })) {
            fs.symlinkSync(
                path.join(entry.path, entry.name),
                path.join(TEST_DIRECTORY, "node_modules", entry.name)
            );
        }

        fs.symlinkSync(
            path.join(__dirname, "..", "..", "dist"),
            path.join(TEST_DIRECTORY, "node_modules", "cypress-xray-plugin")
        );
    });

    it.only("cy.request gets overwritten", () => {
        fs.writeFileSync(
            TEST_FILE,
            dedent(`
                describe("request", () => {
                    it("does something", () => {
                        cy.request("https://example.org");
                    });
                });
            `)
        );
        const result = childProcess.spawnSync(CYPRESS_EXECUTABLE, ["run"], {
            cwd: TEST_DIRECTORY,
            env: process.env,
            shell: true,
        });
        if (result.status !== 0) {
            if (result.error) {
                throw new Error(
                    dedent(`
                        Cypress command finished with unexpected non-zero status code ${chalk.red(
                            result.status
                        )}:

                            ${chalk.red(result.error.toString())}

                            stdout:

                                ${String(result.stdout)}

                            stderr:

                                ${String(result.stderr)}
                    `)
                );
            }
            throw new Error(
                dedent(`
                    Cypress command finished with unexpected non-zero status code ${chalk.red(
                        result.status
                    )}

                        stdout:

                            ${String(result.stdout)}

                        stderr:

                            ${String(result.stderr)}
                `)
            );
        }
    }).timeout(60000);
});
