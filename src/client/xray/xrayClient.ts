import {
    BasicAuthCredentials,
    JWTCredentials,
    PATCredentials,
} from "../../authentication/credentials";
import { logError } from "../../logging/logging";
import {
    ExportCucumberTestsResponse,
    ImportCucumberTestsResponse,
} from "../../types/xray/responses";
import { Client } from "../client";

/**
 * An abstract Xray client class for communicating with Xray instances.
 */
export abstract class XrayClient<
    T extends BasicAuthCredentials | PATCredentials | JWTCredentials
> extends Client<T> {
    /**
     * Construct a new Xray client using the provided credentials.
     *
     * @param credentials the credentials to use during authentication
     */
    constructor(credentials: T) {
        super(credentials);
    }

    /**
     * Uploads test results to the Xray instance.
     *
     * @param results the test results as provided by Cypress
     * @returns the response of the Xray instance
     * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2
     */
    public importTestExecutionResults(
        results: CypressCommandLine.CypressRunResult
    ): Promise<string> {
        try {
            return this.dispatchImportTestExecutionResultsRequest(results);
        } catch (error: unknown) {
            this.writeErrorFile(error, "importExecutionResultsError");
            logError(`Failed to upload results to Xray: "${error}"`);
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
    ): Promise<string>;

    /**
     * Downloads feature (file) specifications from corresponding Xray issues.
     *
     * @param keys a string containing a list of issue keys separated by ";"
     * @param filter an integer that represents the filter ID
     * @returns the response of the Xray instance
     * @see https://docs.getxray.app/display/XRAYCLOUD/Exporting+Cucumber+Tests+-+REST+v2
     */
    public exportCucumberTests(
        keys?: string,
        filter?: number
    ): Promise<ExportCucumberTestsResponse> {
        try {
            return this.dispatchExportCucumberTestsRequest(keys, filter);
        } catch (error: unknown) {
            this.writeErrorFile(error, "exportCucumberTestsError");
            logError(`Failed to export cucumber feature files: "${error}"`);
        }
    }

    /**
     * Dispatch the export Cucumber test request to the Xray instance.
     *
     * @param keys a string containing a list of issue keys separated by ";"
     * @param filter an integer that represents the filter ID
     * @returns the response of the Xray instance
     */
    public abstract dispatchExportCucumberTestsRequest(
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
    public importCucumberTests(
        file: string,
        projectKey?: string,
        projectId?: string,
        source?: string
    ): Promise<ImportCucumberTestsResponse> {
        try {
            return this.dispatchImportCucumberTestsRequest(
                file,
                projectKey,
                projectId,
                source
            );
        } catch (error: unknown) {
            this.writeErrorFile(error, "importCucumberTestsError");
            logError(`Failed to import cucumber feature files: "${error}"`);
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
    public abstract dispatchImportCucumberTestsRequest(
        file: string,
        projectKey?: string,
        projectId?: string,
        source?: string
    ): Promise<ImportCucumberTestsResponse>;
}
