import chalk from "chalk";
import * as childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { dedent } from "../src/util/dedent";
import { TEST_TMP_DIR } from "./util";

const CYPRESS_EXECUTABLE = path.join(__dirname, "..", "node_modules", ".bin", "cypress");

const CONFIG_FILE = dedent(`
    const { defineConfig } = require("cypress");
    const { configureXrayPlugin } = require("cypress-xray-plugin");

    async function setupNodeEvents(on, config) {
        await configureXrayPlugin(on, config, {
            jira: {
                url: "https://example.org",
                projectKey: "CYP",
                testExecutionIssueDescription: "${new Date().toLocaleString()}",
                testExecutionIssueSummary: "Integration tests"
            },
            plugin: {
                debug: true
            }
        });
        return config;
    }

    module.exports = defineConfig({
        e2e: {
            specPattern: "*.cy.js",
            setupNodeEvents
        },
    });
`);

const E2E_FILE = dedent(`
    import "./commands";
`);

const SUPPORT_FILE = dedent(`
    import "cypress-xray-plugin/commands";
`);

export function setupCypressProject(project: {
    configFileContent?: string;
    supportFileContent?: string;
    e2eFileContent?: string;
    testFiles: { fileName: string; content: string }[];
}): {
    projectDirectory: string;
    logDirectory: string;
} {
    if (!fs.existsSync(TEST_TMP_DIR)) {
        fs.mkdirSync(TEST_TMP_DIR, { recursive: true });
    }
    const directory = fs.mkdtempSync(path.join(TEST_TMP_DIR, "integration-"));
    const supportDirectory = path.join(directory, "cypress", "support");

    fs.writeFileSync(
        path.join(directory, "cypress.config.js"),
        project.configFileContent ?? CONFIG_FILE
    );

    fs.mkdirSync(supportDirectory, { recursive: true });
    fs.writeFileSync(
        path.join(supportDirectory, "commands.js"),
        project.supportFileContent ?? SUPPORT_FILE
    );
    fs.writeFileSync(path.join(supportDirectory, "e2e.js"), project.e2eFileContent ?? E2E_FILE);

    fs.mkdirSync(path.join(directory, "node_modules"), { recursive: true });
    for (const entry of fs.readdirSync(path.join(__dirname, "..", "node_modules"), {
        withFileTypes: true,
    })) {
        fs.symlinkSync(
            path.join(entry.path, entry.name),
            path.join(directory, "node_modules", entry.name)
        );
    }
    fs.symlinkSync(
        path.join(__dirname, "..", "dist"),
        path.join(directory, "node_modules", "cypress-xray-plugin")
    );

    for (const testFile of project.testFiles) {
        fs.writeFileSync(path.join(directory, testFile.fileName), testFile.content);
    }

    return {
        projectDirectory: directory,
        logDirectory: path.join(directory, "logs"),
    };
}

export function runCypress(cwd: string, env: object): void {
    const result = childProcess.spawnSync(CYPRESS_EXECUTABLE, ["run"], {
        cwd: cwd,
        env: {
            ...process.env,
            ...env,
        },
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
}
