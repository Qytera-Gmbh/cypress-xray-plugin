import { toXrayJSON } from "../conversion/conversion";
import { APICredentials, APICredentialsOptions } from "../credentials";
import {
    ExportFeatureFileResponse,
    ImportExecutionResultsResponse,
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
    ): Promise<ImportExecutionResultsResponse> {
        const json = toXrayJSON(results as CypressCommandLine.CypressRunResult);
        return await this.doImportExecutionResults(json);
    }

    protected abstract doImportExecutionResults(
        executionResults: XrayExecutionResults
    ): Promise<ImportExecutionResultsResponse>;

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
    ): Promise<ExportFeatureFileResponse> {
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
    ): Promise<ExportFeatureFileResponse>;
}
