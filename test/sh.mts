import ansiColors from "ansi-colors";
import * as childProcess from "node:child_process";
import fs from "node:fs";
import path, { join } from "node:path";

// eslint-disable-next-line @typescript-eslint/naming-convention
const { dedent } = await import("../src/util/dedent.js");

const ENV_BACKUP = { ...process.env };

import "dotenv/config";

const CYPRESS_EXECUTABLE = path.join(import.meta.dirname, "..", "node_modules", ".bin", "cypress");

const ENV_CLOUD = [
    "CYPRESS_JIRA_PROJECT_KEY_CLOUD",
    "CYPRESS_XRAY_CLIENT_SECRET_CLOUD",
    "CYPRESS_XRAY_CLIENT_ID_CLOUD",
    "CYPRESS_JIRA_API_TOKEN_CLOUD",
    "CYPRESS_JIRA_USERNAME_CLOUD",
    "CYPRESS_JIRA_URL_CLOUD",
    "CYPRESS_JIRA_PASSWORD_CLOUD",
];

const ENV_SERVER = [
    "CYPRESS_JIRA_PROJECT_KEY_SERVER",
    "CYPRESS_XRAY_CLIENT_SECRET_SERVER",
    "CYPRESS_XRAY_CLIENT_ID_SERVER",
    "CYPRESS_JIRA_API_TOKEN_SERVER",
    "CYPRESS_JIRA_USERNAME_SERVER",
    "CYPRESS_JIRA_URL_SERVER",
    "CYPRESS_JIRA_PASSWORD_SERVER",
];

export function runCypress(
    cwd: string,
    options?: {
        env?: Record<string, string | undefined>;
        expectedStatusCode?: number;
        includeDefaultEnv?: "cloud" | "server";
    }
): string[] {
    let mergedEnv = {
        ...ENV_BACKUP,
    };
    if (options?.includeDefaultEnv === "cloud") {
        mergedEnv = {
            ...mergedEnv,
            ...getEnv(ENV_CLOUD),
        };
    }
    if (options?.includeDefaultEnv === "server") {
        mergedEnv = {
            ...mergedEnv,
            ...getEnv(ENV_SERVER),
        };
    }
    mergedEnv = {
        ...mergedEnv,
        ...options?.env,
    };
    fs.writeFileSync(
        path.join(cwd, "cypress.env.json"),
        JSON.stringify(
            mergedEnv,
            (...args) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return args[1] ?? undefined;
            },
            2
        ).replaceAll("CYPRESS_", "")
    );
    if (!fs.existsSync(join(cwd, "node_modules"))) {
        const result = childProcess.spawnSync("npm", ["install"], {
            cwd: cwd,
            shell: true,
        });
        if (result.status !== 0) {
            if (result.error) {
                throw new Error(
                    dedent(`
                        npm installation finished with unexpected non-zero status code ${ansiColors.red(
                            String(result.status)
                        )}:

                            ${ansiColors.red(result.error.toString())}

                            stdout:

                                ${String(result.stdout)}

                            stderr:

                                ${String(result.stderr)}
                    `)
                );
            }
            throw new Error(
                dedent(`
                    npm installation finished with unexpected non-zero status code ${ansiColors.red(
                        String(result.status)
                    )}

                        stdout:

                            ${String(result.stdout)}

                        stderr:

                            ${String(result.stderr)}
                `)
            );
        }
    }
    const result = childProcess.spawnSync(CYPRESS_EXECUTABLE, ["run"], {
        cwd: cwd,
        env: mergedEnv,
        shell: true,
    });
    if (result.status !== (options?.expectedStatusCode ?? 0)) {
        if (result.error) {
            throw new Error(
                dedent(`
                    Cypress command finished with unexpected non-zero status code ${ansiColors.red(
                        String(result.status)
                    )}:

                        ${ansiColors.red(result.error.toString())}

                        stdout:

                            ${String(result.stdout)}

                        stderr:

                            ${String(result.stderr)}
                `)
            );
        }
        throw new Error(
            dedent(`
                Cypress command finished with unexpected non-zero status code ${ansiColors.red(
                    String(result.status)
                )}

                    stdout:

                        ${String(result.stdout)}

                    stderr:

                        ${String(result.stderr)}
            `)
        );
    }
    const output = result.output
        .filter((buffer): buffer is Buffer => buffer !== null)
        .map((buffer) => buffer.toString("utf8"));
    fs.writeFileSync(path.join(cwd, "integration-test.log"), output.join("\n"));
    return output;
}

function getEnv(names: string[]): Record<string, string | undefined> {
    const env: Record<string, string | undefined> = {};
    for (const name of names) {
        const truncatedName = name.replace(/_CLOUD$/, "").replace(/_SERVER$/, "");
        const value = process.env[name];
        env[truncatedName] = value;
    }
    return env;
}

export interface IntegrationTest {
    commandFileContent?: string;
    env?: Record<string, string | undefined>;
    service: "cloud" | "server";
    testIssueKey: string;
    title: string;
}
