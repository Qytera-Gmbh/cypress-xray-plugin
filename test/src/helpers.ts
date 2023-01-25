import { Client } from "../../src/client/client";
import {
    ExportCucumberTestsResponse,
    ImportCucumberTestsResponse,
    ImportIssueResponse,
} from "../../src/types/xray/responses";
import { XrayExecutionResults } from "../../src/types/xray/xray";

export class DummyClient extends Client<any> {
    constructor() {
        super(null);
    }

    protected doImportExecutionResults(
        executionResults: XrayExecutionResults
    ): Promise<ImportIssueResponse> {
        throw new Error("Method not implemented.");
    }

    protected doExportCucumberTests(
        keys?: string,
        filter?: number
    ): Promise<ExportCucumberTestsResponse> {
        throw new Error("Method not implemented.");
    }
    protected doImportCucumberTests(
        file: string,
        projectKey?: string,
        projectId?: string,
        source?: string
    ): Promise<ImportCucumberTestsResponse> {
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
        throw new Error(
            `Expected environment variable ${key} to not be undefined, which it was`
        );
    }
    return value as string;
}
