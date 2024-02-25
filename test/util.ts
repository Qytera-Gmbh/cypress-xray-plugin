import fs from "fs";
import path from "path";
import { CypressFailedRunResultType, CypressRunResultType } from "../src/types/cypress/run-result";
import { unknownToString } from "../src/util/string";

const TEST_TMP_DIR = "test/out";

export function resolveTestDirPath(...subPaths: string[]): string {
    return path.resolve(TEST_TMP_DIR, ...subPaths);
}

// Clean up temporary directory at the end of all tests.
after(() => {
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
export function assertIsInstanceOf<T, V extends unknown[]>(
    value: unknown,
    className: new (...args: V) => T
): asserts value is T {
    if (!(value instanceof className)) {
        throw new Error(`Value is not an instance of ${className.name}: ${unknownToString(value)}`);
    }
}

// ============================================================================================== //
// Huge hack around Cypress's event handling. It somewhat works, don't question it :(             //
// ============================================================================================== //
type Action =
    | "after:run"
    | "after:screenshot"
    | "after:spec"
    | "before:run"
    | "before:spec"
    | "before:browser:launch"
    | "file:preprocessor"
    | "dev-server:start"
    | "task";

interface ActionCallbacks {
    ["after:run"]: (results: CypressRunResultType | CypressFailedRunResultType) => Promise<void>;
    ["after:screenshot"]: (
        details: Cypress.ScreenshotDetails
    ) => Promise<Cypress.AfterScreenshotReturnObject>;
    ["after:spec"]: (spec: Cypress.Spec, results: CypressRunResultType) => Promise<void>;
    ["before:run"]: (runDetails: Cypress.BeforeRunDetails) => Promise<void>;
    ["before:spec"]: (spec: Cypress.Spec) => Promise<void>;
    ["before:browser:launch"]: (
        browser: Cypress.Browser,
        browserLaunchOptions: Cypress.BrowserLaunchOptions
    ) => Promise<Cypress.BrowserLaunchOptions>;
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
            default:
        }
    };
    return eventListener;
}
