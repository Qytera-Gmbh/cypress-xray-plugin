import {
    BasicAuthCredentials,
    JWTCredentials,
    PATCredentials,
} from "../../authentication/credentials";
import { logError, logWarning, writeErrorFile } from "../../logging/logging";
import { OneOf } from "../../types/util";
import { ExportCucumberTestsResponse } from "../../types/xray/responses/exportFeature";
import {
    ImportFeatureResponseCloud,
    ImportFeatureResponseServer,
} from "../../types/xray/responses/importFeature";
import { Client } from "../client";

/**
 * An abstract Xray client class for communicating with Xray instances.
 */
export abstract class XrayClient<
    T extends BasicAuthCredentials | PATCredentials | JWTCredentials,
    I extends OneOf<[ImportFeatureResponseServer, ImportFeatureResponseCloud]>
> extends Client<T> {
    constructor(credentials: T) {
        super(credentials);
    }

    /**
     * Uploads test results to the Xray instance.
     *
     * @param results the test results as provided by Cypress
     * @returns the key of the test execution issue or null if the upload was skipped
     * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2
     */
    public async importTestExecutionResults(
        results: CypressCommandLine.CypressRunResult
    ): Promise<string | null> {
        try {
            const key = await this.dispatchImportTestExecutionResultsRequest(results);
            if (key === null) {
                logWarning("No tests linked to Xray were executed. Skipping upload.");
            }
            return key;
        } catch (error: unknown) {
            logError(`Failed to upload results to Xray: "${error}"`);
            writeErrorFile(error, "importExecutionResultsError");
        }
    }

    /**
     * Dispatch the test results import request to the Xray instance.
     *
     * @param results the test results as provided by Cypress
     * @returns the response of the Xray instance
     */
    protected abstract dispatchImportTestExecutionResultsRequest(
        results: CypressCommandLine.CypressRunResult
    ): Promise<string | null>;

    /**
     * Downloads feature (file) specifications from corresponding Xray issues.
     *
     * @param keys a string containing a list of issue keys separated by ";"
     * @param filter an integer that represents the filter ID
     * @returns the response of the Xray instance
     * @see https://docs.getxray.app/display/XRAYCLOUD/Exporting+Cucumber+Tests+-+REST+v2
     */
    public async exportCucumberTests(
        keys?: string,
        filter?: number
    ): Promise<ExportCucumberTestsResponse> {
        try {
            return await this.dispatchExportCucumberTestsRequest(keys, filter);
        } catch (error: unknown) {
            logError(`Failed to export cucumber feature files: "${error}"`);
            writeErrorFile(error, "exportCucumberTestsError");
        }
    }

    /**
     * Dispatch the export Cucumber test request to the Xray instance.
     *
     * @param keys a string containing a list of issue keys separated by ";"
     * @param filter an integer that represents the filter ID
     * @returns the response of the Xray instance
     */
    protected abstract dispatchExportCucumberTestsRequest(
        keys?: string,
        filter?: number
    ): Promise<ExportCucumberTestsResponse>;

    /**
     * Uploads (zipped) feature file(s) to corresponding Xray issues.
     *
     * @param file the (zipped) Cucumber feature file(s)
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
    ): Promise<I> {
        try {
            return await this.dispatchImportCucumberTestsRequest(
                file,
                projectKey,
                projectId,
                source
            );
        } catch (error: unknown) {
            logError(`Failed to import cucumber feature files: "${error}"`);
            writeErrorFile(error, "importCucumberTestsError");
        }
    }

    /**
     * Dispatch the import Cucumber test request to the Xray instance.
     *
     * @param file the (zipped) Cucumber feature file(s)
     * @param projectKey key of the project where the tests and pre-conditions are going to be created
     * @param projectId id of the project where the tests and pre-conditions are going to be created
     * @param source a name designating the source of the features being imported (e.g. the source project name)
     * @returns the response of the Xray instance
     */
    protected abstract dispatchImportCucumberTestsRequest(
        file: string,
        projectKey?: string,
        projectId?: string,
        source?: string
    ): Promise<I>;
}
