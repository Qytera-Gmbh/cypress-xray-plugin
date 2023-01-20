import { toXrayJSON } from "../conversion/conversion";
import { APICredentials, APICredentialsOptions } from "../credentials";
import {
    ExportCucumberTestsResponse,
    ImportCucumberTestsResponse,
    ImportIssueResponse,
} from "../types/xray/responses";
import { XrayExecutionResults } from "../types/xray/xray";

/**
 * A basic client interface which stores credentials data used for
 * communicating with the server.
 */
export abstract class Client<T extends APICredentials<APICredentialsOptions>> {
    protected readonly credentials: T;

    constructor(credentials: T) {
        this.credentials = credentials;
    }

    /**
     * Uploads test results to the Xray instance.
     * @param results the test results as provided by Cypress
     * @returns the response of the Xray instance
     * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2
     */
    public async importExecutionResults(
        results: CypressCommandLine.CypressRunResult
    ): Promise<ImportIssueResponse> {
        const json = toXrayJSON(results as CypressCommandLine.CypressRunResult);
        return await this.doImportExecutionResults(json);
    }

    protected abstract doImportExecutionResults(
        executionResults: XrayExecutionResults
    ): Promise<ImportIssueResponse>;

    /**
     * Downloads feature (file) specifications from corresponding Xray issues.
     * @param keys a string containing a list of issue keys separated by ";"
     * @param filter an integer that represents the filter ID
     * @returns the response of the Xray instance
     * @see https://docs.getxray.app/display/XRAYCLOUD/Exporting+Cucumber+Tests+-+REST+v2
     */
    public async exportCucumberTests(
        keys?: string,
        filter?: number
    ): Promise<ExportCucumberTestsResponse> {
        if (!keys && !filter) {
            throw new Error(
                "Either keys or filter (or both) must be specified to export cucumber feature files"
            );
        }
        return this.doExportCucumberTests(keys, filter);
    }

    protected abstract doExportCucumberTests(
        keys?: string,
        filter?: number
    ): Promise<ExportCucumberTestsResponse>;

    /**
     * Uploads (zipped) feature file(s) to corresponding Xray issues.
     * @param projectKey key of the project where the tests and pre-conditions are going to be created
     * @param projectId id of the project where the tests and pre-conditions are going to be created
     * @param source a name designating the source of the features being imported (e.g. the source project name)
     * @returns the response of the Xray instance
     * @see https://docs.getxray.app/display/XRAYCLOUD/Exporting+Cucumber+Tests+-+REST+v2
     */
    public async importCucumberTests(
        file: string,
        projectKey?: string,
        projectId?: string,
        source?: string
    ): Promise<ImportCucumberTestsResponse> {
        return this.doImportCucumberTests(file, projectKey, projectId, source);
    }

    protected abstract doImportCucumberTests(
        file: string,
        projectKey?: string,
        projectId?: string,
        source?: string
    ): Promise<ImportCucumberTestsResponse>;
}
