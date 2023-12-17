import { AxiosResponse, HttpStatusCode, isAxiosError } from "axios";
import FormData from "form-data";
import fs from "fs";
import {
    BasicAuthCredentials,
    JWTCredentials,
    PATCredentials,
} from "../../authentication/credentials";
import { REST, RequestConfigPost } from "../../https/requests";
import { logDebug, logError, logWarning, writeErrorFile } from "../../logging/logging";
import { IXrayTestExecutionResults } from "../../types/xray/importTestExecutionResults";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { ICucumberMultipartInfo } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { ExportCucumberTestsResponse } from "../../types/xray/responses/exportFeature";
import {
    ImportExecutionResponseCloud,
    ImportExecutionResponseServer,
} from "../../types/xray/responses/importExecution";
import {
    ImportFeatureResponse,
    ImportFeatureResponseCloud,
    ImportFeatureResponseServer,
} from "../../types/xray/responses/importFeature";
import { dedent } from "../../util/dedent";
import { LoggedError } from "../../util/errors";
import { HELP } from "../../util/help";
import { Client } from "../client";

export interface IXrayClient {
    /**
     * Uploads test results to the Xray instance.
     *
     * @param results - the test results as provided by Cypress
     * @returns the key of the test execution issue, `null` if the upload was skipped or `undefined`
     * in case of errors
     * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2
     */
    importExecution(execution: IXrayTestExecutionResults): Promise<string | null | undefined>;
    /**
     * Downloads feature (file) specifications from corresponding Xray issues.
     *
     * @param keys - a list of issue keys
     * @param filter - an integer that represents the filter ID
     * @returns the response of the Xray instance
     * @see https://docs.getxray.app/display/XRAYCLOUD/Exporting+Cucumber+Tests+-+REST+v2
     */
    exportCucumber(keys?: string[], filter?: number): Promise<ExportCucumberTestsResponse>;
    /**
     * Uploads (zipped) feature file(s) to corresponding Xray issues.
     *
     * @param file - the (zipped) Cucumber feature file(s)
     * @param projectKey - key of the project where the tests and pre-conditions are located
     * @param projectId - id of the project where the tests and pre-conditions are located
     * @param source - a name designating the source of the features being imported (e.g. the source project name)
     * @returns the response containing updated issues
     * @see https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
     * @see https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
     */
    importFeature(
        file: string,
        projectKey?: string,
        projectId?: string,
        source?: string
    ): Promise<ImportFeatureResponse>;
    /**
     * Uploads Cucumber test results to the Xray instance.
     *
     * @param cucumberJson - the test results as provided by the `cypress-cucumber-preprocessor`
     * @param cucumberInfo - the test execution information
     * @returns the key of the test execution issue, `null` if the upload was skipped or `undefined`
     * in case of errors
     * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#ImportExecutionResultsREST-CucumberJSONresultsMultipart
     * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2
     */
    importExecutionCucumberMultipart(
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: ICucumberMultipartInfo
    ): Promise<string | null | undefined>;
}

/**
 * An abstract Xray client class for communicating with Xray instances.
 */
export abstract class XrayClient extends Client implements IXrayClient {
    /**
     * Construct a new client using the provided credentials.
     *
     * @param apiBaseUrl - the base URL for all HTTP requests
     * @param credentials - the credentials to use during authentication
     */
    constructor(
        apiBaseUrl: string,
        credentials: BasicAuthCredentials | PATCredentials | JWTCredentials
    ) {
        super(apiBaseUrl, credentials);
    }

    public async importExecution(
        execution: IXrayTestExecutionResults
    ): Promise<string | null | undefined> {
        try {
            if (!execution.tests || execution.tests.length === 0) {
                logWarning("No native Cypress tests were executed. Skipping native upload.");
                return null;
            }
            const authorizationHeader = await this.credentials.getAuthorizationHeader();
            logDebug("Importing execution...");
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
                const response: AxiosResponse<
                    ImportExecutionResponseServer | ImportExecutionResponseCloud
                > = await REST.post(this.getUrlImportExecution(), execution, {
                    headers: {
                        ...authorizationHeader,
                    },
                });
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
     * Returns the endpoint to use for importing test execution results.
     *
     * @returns the URL
     */
    public abstract getUrlImportExecution(): string;

    /**
     * Returns the test execution key from the import execution response.
     *
     * @param response - the import execution response
     * @returns the test execution issue key
     */
    protected abstract handleResponseImportExecution(
        response: ImportExecutionResponseServer | ImportExecutionResponseCloud
    ): string;

    public async exportCucumber(
        keys?: string[],
        filter?: number
    ): Promise<ExportCucumberTestsResponse> {
        try {
            const authorizationHeader = await this.credentials.getAuthorizationHeader();
            logDebug("Exporting Cucumber tests...");
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
                const response = await REST.get(this.getUrlExportCucumber(keys, filter), {
                    headers: {
                        ...authorizationHeader,
                    },
                });
                // Extract filename from response.
                const contentDisposition = response.headers["Content-Disposition"];
                const filenameStart = contentDisposition.indexOf('"');
                const filenameEnd = contentDisposition.lastIndexOf('"');
                const filename = contentDisposition.substring(filenameStart, filenameEnd);
                fs.writeFile(filename, response.data, (error: NodeJS.ErrnoException | null) => {
                    throw new Error(`Failed to export cucumber feature files: "${error}"`);
                });
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
     * Returns the endpoint to use for exporting Cucumber feature files.
     *
     * @param keys - a list of issue keys
     * @param filter - an integer that represents the filter ID
     * @returns the URL
     */
    public abstract getUrlExportCucumber(issueKeys?: string[], filter?: number): string;

    public async importFeature(
        file: string,
        projectKey?: string,
        projectId?: string,
        source?: string
    ): Promise<ImportFeatureResponse> {
        try {
            const authorizationHeader = await this.credentials.getAuthorizationHeader();
            logDebug("Importing Cucumber features...");
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
                const fileContent = fs.createReadStream(file);
                const form = new FormData();
                form.append("file", fileContent);

                const response: AxiosResponse<
                    ImportFeatureResponseServer | ImportFeatureResponseCloud
                > = await REST.post(this.getUrlImportFeature(projectKey, projectId, source), form, {
                    headers: {
                        ...authorizationHeader,
                        ...form.getHeaders(),
                    },
                });
                return this.handleResponseImportFeature(response.data);
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            writeErrorFile(error, "importFeatureError");
            if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
                logError(
                    dedent(`
                        Failed to import Cucumber features: ${error}

                        The prefixes in Cucumber background or scenario tags might be inconsistent with the scheme defined in Xray

                        For more information, visit:
                        - ${HELP.plugin.configuration.cucumber.prefixes}
                    `)
                );
            } else {
                logError(`Failed to import Cucumber features: ${error}`);
            }
            throw new LoggedError("Feature file import failed");
        }
    }

    /**
     * Returns the endpoint to use for importing Cucumber feature files.
     *
     * @param projectKey - key of the project where the tests and pre-conditions are located
     * @param projectId - id of the project where the tests and pre-conditions are located
     * @param source - a name designating the source of the features being imported (e.g. the source project name)
     * @returns the URL
     */
    public abstract getUrlImportFeature(
        projectKey?: string,
        projectId?: string,
        source?: string
    ): string;

    /**
     * This method is called when a feature file was successfully imported to Xray.
     *
     * @param response - the import feature response or `undefined` in case of errors
     */
    protected abstract handleResponseImportFeature(
        response: ImportFeatureResponseServer | ImportFeatureResponseCloud
    ): ImportFeatureResponse;

    public async importExecutionCucumberMultipart(
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: ICucumberMultipartInfo
    ): Promise<string | null | undefined> {
        try {
            if (cucumberJson.length === 0) {
                logWarning("No Cucumber tests were executed. Skipping Cucumber upload.");
                return null;
            }
            logDebug("Importing execution (Cucumber)...");
            const request = await this.prepareRequestImportExecutionCucumberMultipart(
                cucumberJson,
                cucumberInfo
            );
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
                const response: AxiosResponse<
                    ImportExecutionResponseServer | ImportExecutionResponseCloud
                > = await REST.post(request.url, request.data, request.config);
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
     * Prepares the Cucumber multipart import execution request.
     *
     * @param cucumberJson - the test results as provided by the `cypress-cucumber-preprocessor`
     * @param cucumberInfo - the test execution information
     * @returns the import execution request
     */
    protected abstract prepareRequestImportExecutionCucumberMultipart(
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: ICucumberMultipartInfo
    ): Promise<RequestConfigPost<FormData>>;

    /**
     * Returns the test execution key from the Cucumber multipart import execution response.
     *
     * @param response - the import execution response
     * @returns the test execution issue key
     */
    protected abstract handleResponseImportExecutionCucumberMultipart(
        response: ImportExecutionResponseServer | ImportExecutionResponseCloud
    ): string;
}
