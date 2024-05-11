import chalk from "chalk";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const TEST_TMP_DIR = path.join(os.tmpdir(), "cypress-xray-plugin");
console.log(chalk.gray(`Temporary directory: ${TEST_TMP_DIR}`));

export const TIMEOUT_INTEGRATION_TESTS = 120000;

export function resolveTestDirPath(...subPaths: string[]): string {
    return path.resolve(TEST_TMP_DIR, ...subPaths);
}

// Clean up temporary directory before all tests.
before(() => {
    if (fs.existsSync(TEST_TMP_DIR)) {
        fs.rmSync(TEST_TMP_DIR, { recursive: true });
    }
});

/**
 * Use in place of `expect(value).to.exist`
 *
 * Work-around for Chai assertions not being recognized by TypeScript's control flow analysis.
 * @param value - the value
 * @see https://stackoverflow.com/a/65099907
 */
export function expectToExist<T>(value: T): asserts value is NonNullable<T> {
    if (value === null || value === undefined) {
        throw new Error("Expected value to exist");
    }
}

/**
 * Utility function returning environment variable values as strings and throwing errors
 * if they are not defined.
 *
 * @param key - the key of the environment variable whose value to retrieve
 * @returns the environment variable value
 * @throws if the environment variable is not defined
 */
export function env(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Expected environment variable ${key} to not be undefined, which it was`);
    }
    return value;
}

export function arrayEquals(a: unknown[], b: unknown[]) {
    return a.length === b.length && a.every((val, index) => val === b[index]);
}

// ============================================================================================== //
// Huge hack around Cypress's event handling. It somewhat works, don't question it :(             //
// ============================================================================================== //
type Action =
    | "after:browser:launch"
    | "after:run"
    | "after:screenshot"
    | "after:spec"
    | "before:browser:launch"
    | "before:run"
    | "before:spec"
    | "file:preprocessor"
    | "dev-server:start"
    | "task";

interface ActionCallbacks {
    ["after:browser:launch"]: (
        browser: Cypress.Browser,
        browserLaunchOptions: Cypress.AfterBrowserLaunchDetails
    ) => Promise<Cypress.BeforeBrowserLaunchOptions>;
    ["after:run"]: (
        results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult
    ) => Promise<void>;
    ["after:screenshot"]: (
        details: Cypress.ScreenshotDetails
    ) => Promise<Cypress.AfterScreenshotReturnObject>;
    ["after:spec"]: (spec: Cypress.Spec, results: CypressCommandLine.RunResult) => Promise<void>;
    ["before:browser:launch"]: (
        browser: Cypress.Browser,
        browserLaunchOptions: Cypress.BeforeBrowserLaunchOptions
    ) => Promise<Cypress.BeforeBrowserLaunchOptions>;
    ["before:run"]: (runDetails: Cypress.BeforeRunDetails) => Promise<void>;
    ["before:spec"]: (spec: Cypress.Spec) => Promise<void>;
    ["file:preprocessor"]: (file: Cypress.FileObject) => Promise<string>;
    ["dev-server:start"]: (
        file: Cypress.DevServerConfig
    ) => Promise<Cypress.ResolvedDevServerConfig>;
    task: (tasks: Cypress.Tasks) => void;
}

export function mockedCypressEventEmitter<A extends Action>(
    expectedAction: A,
    ...args: Parameters<ActionCallbacks[A]>
): Cypress.PluginEvents {
    const eventListener: Cypress.PluginEvents = (
        action: Action,
        fn: ((...args: never[]) => unknown) | Cypress.Tasks
    ): void => {
        if (action !== expectedAction) {
            return;
        }
        switch (action) {
            case "after:run": {
                const f = fn as ActionCallbacks["after:run"];
                const parameters = args as Parameters<ActionCallbacks["after:run"]>;
                f(...parameters).catch((error: unknown) => {
                    throw error;
                });
                break;
            }
            case "before:run": {
                const f = fn as ActionCallbacks["before:run"];
                const parameters = args as Parameters<ActionCallbacks["before:run"]>;
                f(...parameters).catch((error: unknown) => {
                    throw error;
                });
                break;
            }
            default:
        }
    };
    return eventListener;
}
