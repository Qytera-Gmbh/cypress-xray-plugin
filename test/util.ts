import { AxiosHeaders, HttpStatusCode } from "axios";
import chai from "chai";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import Sinon, { spy, stub } from "sinon";
import sinonChai from "sinon-chai";
import { JWTCredentials, PATCredentials } from "../src/authentication/credentials";
import { JiraClient } from "../src/client/jira/jiraClient";
import { XrayClient } from "../src/client/xray/xrayClient";
import { RequestConfigPost, Requests } from "../src/https/requests";
import * as logging from "../src/logging/logging";
import { initLogging } from "../src/logging/logging";

chai.use(sinonChai);

/**
 * Stubs the logging module members. An optional list of spies can be provided, which will result
 * in the corresponding members being spied on instead of stubbing them completely.
 *
 * @param spies - the array of members to spy on only
 * @returns an object containing the logging module's stubs or spies
 */
export const stubLogging = (...spies: (keyof typeof logging)[]) => {
    return {
        stubbedInit: spies.includes("initLogging")
            ? spy(logging, "initLogging")
            : stub(logging, "initLogging"),
        stubbedWrite: spies.includes("writeFile")
            ? spy(logging, "writeFile")
            : stub(logging, "writeFile"),
        stubbedWriteErrorFile: spies.includes("writeErrorFile")
            ? spy(logging, "writeErrorFile")
            : stub(logging, "writeErrorFile"),
        stubbedInfo: spies.includes("logInfo") ? spy(logging, "logInfo") : stub(logging, "logInfo"),
        stubbedError: spies.includes("logError")
            ? spy(logging, "logError")
            : stub(logging, "logError"),
        stubbedSuccess: spies.includes("logSuccess")
            ? spy(logging, "logSuccess")
            : stub(logging, "logSuccess"),
        stubbedWarning: spies.includes("logWarning")
            ? spy(logging, "logWarning")
            : stub(logging, "logWarning"),
        stubbedDebug: spies.includes("logDebug")
            ? spy(logging, "logDebug")
            : stub(logging, "logDebug"),
    };
};

export const stubRequests = () => {
    return {
        stubbedGet: stub(Requests, "get"),
        stubbedPost: stub(Requests, "post"),
        stubbedPut: stub(Requests, "put"),
        stubbedInit: stub(Requests, "init"),
    };
};

const TEST_TMP_DIR = "test/out";

export function resolveTestDirPath(...subPaths: string[]): string {
    return path.resolve(TEST_TMP_DIR, ...subPaths);
}

export const RESOLVED_JWT_CREDENTIALS: JWTCredentials = new JWTCredentials(
    "user",
    "token",
    "https://example.org"
);

before(() => {
    // Resolve credentials so that they don't have to dispatch POST requests again.
    stubLogging("initLogging");
    const { stubbedPost } = stubRequests();
    stubbedPost.onFirstCall().resolves({
        status: HttpStatusCode.Ok,
        data: "ey.12345.Token",
        headers: {},
        statusText: HttpStatusCode[HttpStatusCode.Ok],
        config: {
            headers: new AxiosHeaders(),
        },
    });
    RESOLVED_JWT_CREDENTIALS.getAuthenticationHeader();
});

beforeEach(() => {
    Sinon.restore();
    initLogging({ logDirectory: TEST_TMP_DIR });
});

// Clean up temporary directory at the end of all tests.
after(async () => {
    if (fs.existsSync(TEST_TMP_DIR)) {
        fs.rmSync(TEST_TMP_DIR, { recursive: true });
    }
});

export class DummyXrayClient extends XrayClient<PATCredentials> {
    constructor() {
        super("https://example.org", new PATCredentials("token"));
    }
    public getUrlImportExecution(): string {
        throw new Error("Method not implemented.");
    }
    public handleResponseImportExecution(): string {
        throw new Error("Method not implemented.");
    }
    public getUrlExportCucumber(): string {
        throw new Error("Method not implemented.");
    }
    public getUrlImportFeature(): string {
        throw new Error("Method not implemented.");
    }
    public handleResponseImportFeature(): void {
        throw new Error("Method not implemented.");
    }
    public getTestTypes(): Promise<{ [key: string]: string }> {
        throw new Error("Method not implemented.");
    }
    public prepareRequestImportExecutionCucumberMultipart(): Promise<RequestConfigPost<FormData>> {
        throw new Error("Method not implemented.");
    }
    public handleResponseImportExecutionCucumberMultipart(): string {
        throw new Error("Method not implemented.");
    }
}

export class DummyJiraClient extends JiraClient<PATCredentials> {
    constructor() {
        super("https://example.org", new PATCredentials("token"));
    }
    public getUrlAddAttachment(): string {
        throw new Error("Method not implemented.");
    }
    public getUrlGetFields(): string {
        throw new Error("Method not implemented.");
    }
    public getUrlPostSearch(): string {
        throw new Error("Method not implemented.");
    }
    public getUrlGetIssueTypes(): string {
        throw new Error("Method not implemented.");
    }
    public getUrlEditIssue(): string {
        throw new Error("Method not implemented.");
    }
}

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
    return value as string;
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

type ActionCallbacks = {
    "after:run": (
        results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult
    ) => void | Promise<void>;
    "after:screenshot": (
        details: Cypress.ScreenshotDetails
    ) => void | Cypress.AfterScreenshotReturnObject | Promise<Cypress.AfterScreenshotReturnObject>;
    "after:spec": (
        spec: Cypress.Spec,
        results: CypressCommandLine.RunResult
    ) => void | Promise<void>;
    "before:run": (runDetails: Cypress.BeforeRunDetails) => void | Promise<void>;
    "before:spec": (spec: Cypress.Spec) => void | Promise<void>;
    "before:browser:launch": (
        browser: Cypress.Browser,
        browserLaunchOptions: Cypress.BrowserLaunchOptions
    ) => void | Cypress.BrowserLaunchOptions | Promise<Cypress.BrowserLaunchOptions>;
    "file:preprocessor": (file: Cypress.FileObject) => string | Promise<string>;
    "dev-server:start": (file: Cypress.DevServerConfig) => Promise<Cypress.ResolvedDevServerConfig>;
    task: (tasks: Cypress.Tasks) => void;
};

export function mockedCypressEventEmitter<A extends Action>(
    expectedAction: A,
    ...args: Parameters<ActionCallbacks[A]>
): Cypress.PluginEvents {
    const events: Cypress.PluginEvents = (
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
                f(...parameters);
                break;
            }
            case "before:run": {
                const f = fn as ActionCallbacks["before:run"];
                const parameters = args as Parameters<ActionCallbacks["before:run"]>;
                f(...parameters);
                break;
            }
            default:
        }
    };
    return events;
}
