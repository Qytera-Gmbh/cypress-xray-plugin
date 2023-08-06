import { AxiosResponse, RawAxiosRequestConfig } from "axios";
import FormData from "form-data";
import fs from "fs";
import {
    BasicAuthCredentials,
    JWTCredentials,
    PATCredentials,
} from "../../authentication/credentials";
import { Requests } from "../../https/requests";
import { logDebug, logError, logWarning, writeErrorFile } from "../../logging/logging";
import {
    XrayTestExecutionResultsCloud,
    XrayTestExecutionResultsServer,
} from "../../types/xray/importTestExecutionResults";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { ExportCucumberTestsResponse } from "../../types/xray/responses/exportFeature";
import { Client } from "../client";

export type RequestConfigGet<D = unknown> = {
    url: string;
    config?: RawAxiosRequestConfig<D>;
};

export type RequestConfigPost<D = unknown> = {
    url: string;
    data?: D;
    config?: RawAxiosRequestConfig<D>;
};

/**
 * An abstract Xray client class for communicating with Xray instances.
 */
export abstract class XrayClient<
    CredentialsType extends BasicAuthCredentials | PATCredentials | JWTCredentials,
    ImportFeatureResponseType,
    ImportExecutionResponseType,
    CucumberMultipartInfoType
> extends Client<CredentialsType> {
    /**
     * Construct a new client using the provided credentials.
     *
     * @param apiBaseUrl the base URL for all HTTP requests
     * @param credentials the credentials to use during authentication
     */
    constructor(apiBaseUrl: string, credentials: CredentialsType) {
        super(apiBaseUrl, credentials);
    }

    /**
     * Uploads test results to the Xray instance.
     *
     * @param results the test results as provided by Cypress
     * @returns the key of the test execution issue, `null` if the upload was skipped or `undefined`
     * in case of errors
     * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2
     */
    public async importExecution<
        ExecutionType extends XrayTestExecutionResultsServer | XrayTestExecutionResultsCloud
    >(execution: ExecutionType): Promise<string | null | undefined> {
        try {
            if (!execution.tests || execution.tests.length === 0) {
                logWarning("No native Cypress tests were executed. Skipping native upload.");
                return null;
            }
            logDebug("Importing execution...");
            const progressInterval = this.startResponseInterval(this.apiBaseURL);
            try {
                const request = await this.prepareRequestImportExecution(execution);
                const response: AxiosResponse<ImportExecutionResponseType> = await Requests.post(
                    request.url,
                    request.data,
                    request.config
                );
                const key = this.handleResponseImportExecution(response.data);
                logDebug(`Successfully uploaded test execution results to ${key}.`);
                return key;
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            logError(`Failed to import execution: ${error}`);
            writeErrorFile(error, "importExecutionError");
        }
    }

    /**
     * Uploads Cucumber test results to the Xray instance.
     *
     * @param cucumberJson the test results as provided by the `cypress-cucumber-preprocessor`
     * @param cucumberInfo the test execution information
     * @returns the key of the test execution issue, `null` if the upload was skipped or `undefined`
     * in case of errors
     * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#ImportExecutionResultsREST-CucumberJSONresultsMultipart
     * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2
     */
    public async importExecutionCucumberMultipart(
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: CucumberMultipartInfoType
    ): Promise<string | null | undefined> {
        try {
            if (cucumberJson.length === 0) {
                logWarning("No Cucumber tests were executed. Skipping Cucumber upload.");
                return null;
            }
            logDebug("Importing execution (Cucumber)...");
            const progressInterval = this.startResponseInterval(this.apiBaseURL);
            try {
                const request = await this.prepareRequestImportExecutionCucumberMultipart(
                    cucumberJson,
                    cucumberInfo
                );
                const response: AxiosResponse<ImportExecutionResponseType> = await Requests.post(
                    request.url,
                    request.data,
                    request.config
                );
                const key = this.handleResponseImportExecutionCucumberMultipart(response.data);
                logDebug(`Successfully uploaded Cucumber test execution results to ${key}.`);
                return key;
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            logError(`Failed to import Cucumber execution: ${error}`);
            writeErrorFile(error, "importExecutionCucumberMultipartError");
        }
    }

    /**
     * Uploads (zipped) feature file(s) to corresponding Xray issues.
     *
     * @param file the (zipped) Cucumber feature file(s)
     * @param projectKey key of the project where the tests and pre-conditions are going to be created
     * @param projectId id of the project where the tests and pre-conditions are going to be created
     * @param source a name designating the source of the features being imported (e.g. the source project name)
     * @returns `true` if the import was successful, `false` otherwise
     * @see https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
     * @see https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
     */
    public async importFeature(
        file: string,
        projectKey?: string,
        projectId?: string,
        source?: string
    ): Promise<boolean> {
        try {
            logDebug("Importing Cucumber features...");
            const progressInterval = this.startResponseInterval(this.apiBaseURL);
            try {
                const request = await this.prepareRequestImportFeature(
                    file,
                    projectKey,
                    projectId,
                    source
                );
                const response: AxiosResponse<ImportFeatureResponseType> = await Requests.post(
                    request.url,
                    request.data,
                    request.config
                );
                this.handleResponseImportFeature(response.data);
                return true;
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            logError(`Failed to import cucumber features: ${error}`);
            writeErrorFile(error, "importFeatureError");
        }
        return false;
    }

    /**
     * Downloads feature (file) specifications from corresponding Xray issues.
     *
     * @param keys a list of issue keys
     * @param filter an integer that represents the filter ID
     * @returns the response of the Xray instance
     * @see https://docs.getxray.app/display/XRAYCLOUD/Exporting+Cucumber+Tests+-+REST+v2
     */
    public async exportCucumber(
        keys?: string[],
        filter?: number
    ): Promise<ExportCucumberTestsResponse> {
        try {
            logDebug("Exporting Cucumber tests...");
            const progressInterval = this.startResponseInterval(this.apiBaseURL);
            try {
                const request = await this.prepareRequestExportCucumber(keys, filter);
                const response = await Requests.get(request.url, request.config);
                this.handleResponseExportCucumber(response);
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            logError(`Failed to export Cucumber tests: ${error}`);
            writeErrorFile(error, "exportCucumberError");
        }
        throw new Error("Method not implemented.");
    }

    /**
     * Prepares the export Cucumber request.
     *
     * @param results the test results as provided by Cypress
     * @returns the import execution request
     */
    protected abstract prepareRequestImportExecution<
        ExecutionType extends XrayTestExecutionResultsServer | XrayTestExecutionResultsCloud
    >(execution: ExecutionType): Promise<RequestConfigPost<ExecutionType>>;

    /**
     * Prepares the Cucumber multipart import execution request.
     *
     * @param cucumberJson the test results as provided by the `cypress-cucumber-preprocessor`
     * @param cucumberInfo the test execution information
     * @returns the import execution request
     */
    protected abstract prepareRequestImportExecutionCucumberMultipart(
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: CucumberMultipartInfoType
    ): Promise<RequestConfigPost<FormData>>;

    /**
     * Prepares the import Cucumber feature request.
     *
     * @param file the (zipped) Cucumber feature file(s)
     * @param projectKey key of the project where the tests and pre-conditions are going to be created
     * @param projectId id of the project where the tests and pre-conditions are going to be created
     * @param source a name designating the source of the features being imported (e.g. the source project name)
     * @returns the import feature request
     */
    protected abstract prepareRequestImportFeature(
        file: string,
        projectKey?: string,
        projectId?: string,
        source?: string
    ): Promise<RequestConfigPost<FormData>>;

    /**
     * Prepares the export Cucumber request.
     *
     * @param keys a list of issue keys
     * @param filter an integer that represents the filter ID
     * @returns the export Cucumber request
     */
    protected abstract prepareRequestExportCucumber(
        keys?: string[],
        filter?: number
    ): Promise<RequestConfigGet>;

    /**
     * Returns the test execution key from the import execution response.
     *
     * @param response the import execution response
     * @returns the test execution issue key
     */
    protected abstract handleResponseImportExecution(response: ImportExecutionResponseType): string;

    /**
     * Returns the test execution key from the Cucumber multipart import execution response.
     *
     * @param response the import execution response
     * @returns the test execution issue key
     */
    protected abstract handleResponseImportExecutionCucumberMultipart(
        response: ImportExecutionResponseType
    ): string;

    /**
     * This method is called when a feature file was successfully imported to Xray.
     *
     * @param response the import feature response
     */
    protected abstract handleResponseImportFeature(response: ImportFeatureResponseType): void;

    /**
     * This method is called when feature files were successfully exported from Xray.
     *
     * @param response the export Cucumber response
     */
    protected handleResponseExportCucumber(response: AxiosResponse) {
        // Extract filename from response.
        const contentDisposition = response.headers["Content-Disposition"];
        const filenameStart = contentDisposition.indexOf('"');
        const filenameEnd = contentDisposition.lastIndexOf('"');
        const filename = contentDisposition.substring(filenameStart, filenameEnd);
        fs.writeFile(filename, response.data, (error: NodeJS.ErrnoException | null) => {
            throw new Error(`Failed to export cucumber feature files: "${error}"`);
        });
    }
}
