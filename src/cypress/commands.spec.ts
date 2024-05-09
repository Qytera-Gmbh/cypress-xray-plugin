import * as childProcess from "child_process";
import fs from "fs";
import path from "path";
import process from "process";
import { resolveTestDirPath } from "../../test/util";
import { dedent } from "../util/dedent";

const TEST_DIRECTORY = resolveTestDirPath("cypress");
const TEST_FILENAME = "testfile.cy.js";
const TEST_FILE = path.resolve(TEST_DIRECTORY, TEST_FILENAME);
const CYPRESS_EXECUTABLE = path.resolve(__dirname, "..", "..", "node_modules", ".bin", "cypress");

const CONFIG_FILE = dedent(`
    const { defineConfig } = require("cypress");
    require("cypress-xray-plugin/register");

    async function setupNodeEvents(on, config) {
        // Make sure to return the config object as it might have been modified by the plugin.
        return config;
    }

    module.exports = defineConfig({
        e2e: {
            experimentalRunAllSpecs: true,
            supportFile: false,
            specPattern: "${TEST_FILENAME}",
            setupNodeEvents
        },
    });
`);

describe(path.relative(process.cwd(), __filename), () => {
    before(() => {
        fs.rmSync(TEST_DIRECTORY, { recursive: true, force: true });
        fs.mkdirSync(TEST_DIRECTORY, { recursive: true });
        fs.writeFileSync(path.join(TEST_DIRECTORY, "cypress.config.js"), CONFIG_FILE);
        fs.mkdirSync(path.join(TEST_DIRECTORY, "node_modules"));
        for (const entry of fs.readdirSync(path.resolve(__dirname, "..", "..", "node_modules"), {
            withFileTypes: true,
        })) {
            fs.symlinkSync(
                path.resolve(entry.path, entry.name),
                path.resolve(TEST_DIRECTORY, "node_modules", entry.name),
                "junction"
            );
        }
        fs.symlinkSync(
            path.resolve(__dirname, "..", "..", "dist"),
            path.resolve(TEST_DIRECTORY, "node_modules", "cypress-xray-plugin"),
            "junction"
        );
    });

    it("request", () => {
        fs.writeFileSync(
            TEST_FILE,
            dedent(`
                describe("request", () => {
                    it("does something", () => {
                        cy.request("https://example.org").then(r => console.log(r.body));
                        expect(true).to.be.false;
                    })
                })
            `)
        );
        console.log(
            Buffer.from(
                childProcess.execSync(`${CYPRESS_EXECUTABLE} run`, {
                    cwd: TEST_DIRECTORY,
                    env: process.env,
                })
            ).toString()
        );
    }).timeout(10000);
});
