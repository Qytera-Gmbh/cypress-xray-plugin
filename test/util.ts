import chalk from "chalk";
import fs from "fs";
import os from "os";
import path from "path";
import type {
    CypressFailedRunResultType,
    CypressRunResultType,
} from "../src/types/cypress/cypress";
import { unknownToString } from "../src/util/string";

export const TEST_TMP_DIR = path.join(os.tmpdir(), "cypress-xray-plugin");
console.log(chalk.gray(`Temporary directory: ${TEST_TMP_DIR}`));

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
 * Use in place of `expect(value).to.exist`.
 *
 * Work-around for Chai assertions not being recognized by TypeScript's control flow analysis.
 *
 * @param value - the value
 * @see https://stackoverflow.com/a/65099907
 */
export function expectToExist<T>(value: T): asserts value is NonNullable<T> {
    if (value === null || value === undefined) {
        throw new Error("Expected value to exist");
    }
}

/**
 * Use in place of `expect(value).to.be.an.instanceOf(class)`.
 *
 * Work-around for Chai assertions not being recognized by TypeScript's control flow analysis.
 *
 * @param value - the value
 * @param className - the instance type
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function assertIsInstanceOf<T, V extends unknown[]>(
    value: unknown,
    className: new (...args: V) => T
): asserts value is T {
    if (!(value instanceof className)) {
        if (typeof value === "object" && value) {
            throw new Error(`${value.constructor.name} is not an instance of ${className.name}`);
        }
        throw new Error(`Value is not an instance of ${className.name}: ${unknownToString(value)}`);
    }
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
    | "dev-server:start"
    | "file:preprocessor"
    | "task";

interface ActionCallbacks {
    ["after:browser:launch"]: (
        browser: Cypress.Browser,
        browserLaunchOptions: Cypress.AfterBrowserLaunchDetails
    ) => Promise<Cypress.BeforeBrowserLaunchOptions>;
    ["after:run"]: (results: CypressFailedRunResultType | CypressRunResultType) => Promise<void>;
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
    ["dev-server:start"]: (
        file: Cypress.DevServerConfig
    ) => Promise<Cypress.ResolvedDevServerConfig>;
    ["file:preprocessor"]: (file: Cypress.FileObject) => Promise<string>;
    ["task"]: (tasks: Cypress.Tasks) => void;
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
            default:
        }
    };
    return eventListener;
}
