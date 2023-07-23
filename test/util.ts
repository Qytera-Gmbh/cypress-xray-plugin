import { HttpStatusCode } from "axios";
import chai from "chai";
import fs from "fs";
import path from "path";
import Sinon, { stub } from "sinon";
import sinonChai from "sinon-chai";
import { JWTCredentials } from "../src/authentication/credentials";
import { JiraClient } from "../src/client/jira/jiraClient";
import { XrayClient } from "../src/client/xray/xrayClient";
import { Requests } from "../src/https/requests";
import * as logging from "../src/logging/logging";
import { initLogging } from "../src/logging/logging";

chai.use(sinonChai);

export const stubLogging = () => {
    return {
        stubbedInfo: stub(logging, "logInfo"),
        stubbedError: stub(logging, "logError"),
        stubbedSuccess: stub(logging, "logSuccess"),
        stubbedWarning: stub(logging, "logWarning"),
        stubbedDebug: stub(logging, "logDebug"),
    };
};

export const stubRequests = () => {
    return {
        stubbedGet: stub(Requests, "get"),
        stubbedPost: stub(Requests, "post"),
    };
};

const TEST_TMP_DIR = "test/out";

export function resolveTestDirPath(...subPaths: string[]): string {
    return path.resolve(TEST_TMP_DIR, ...subPaths);
}

export const RESOLVED_JWT_CREDENTIALS: JWTCredentials = new JWTCredentials("user", "token");

before(() => {
    // Resolve credentials so that they don't have to dispatch POST requests again.
    stubLogging();
    const { stubbedPost } = stubRequests();
    stubbedPost.onFirstCall().resolves({
        status: HttpStatusCode.Ok,
        data: "ey12345Token",
        headers: null,
        statusText: HttpStatusCode[HttpStatusCode.Ok],
        config: null,
    });
    RESOLVED_JWT_CREDENTIALS.getAuthenticationHeader("https://example.org");
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

export class DummyXrayClient extends XrayClient<null, null, null, null, null> {
    constructor() {
        super("https://example.org", null, null);
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
    public getUrlImportExecutionCucumberMultipart(): string {
        throw new Error("Method not implemented.");
    }
    public handleResponseImportExecutionCucumberMultipart(): string {
        throw new Error("Method not implemented.");
    }
}

export class DummyJiraClient extends JiraClient<null, null, null, null, null, null, null> {
    constructor() {
        super("https://example.org", null);
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
}

/**
 * Use in place of `expect(value).to.exist`
 *
 * Work-around for Chai assertions not being recognized by TypeScript's control flow analysis.
 * @param {any} value
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
 * @param key the key of the environment variable whose value to retrieve
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
