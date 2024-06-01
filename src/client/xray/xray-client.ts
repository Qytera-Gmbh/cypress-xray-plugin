import { AxiosResponse, HttpStatusCode, isAxiosError } from "axios";
import FormData from "form-data";
import fs from "fs";
import { XrayTestExecutionResults } from "../../types/xray/import-test-execution-results";
import { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import { CucumberMultipartInfo } from "../../types/xray/requests/import-execution-cucumber-multipart-info";
import {
    ImportExecutionResponseCloud,
    ImportExecutionResponseServer,
} from "../../types/xray/responses/import-execution";
import {
    ImportFeatureResponse,
    ImportFeatureResponseCloud,
    ImportFeatureResponseServer,
} from "../../types/xray/responses/import-feature";
import { dedent } from "../../util/dedent";
import { LoggedError, errorMessage } from "../../util/errors";
import { HELP } from "../../util/help";
import { LOG, Level } from "../../util/logging";
import { Client } from "../client";
import { RequestConfigPost } from "../https/requests";

export interface XrayClient {
    /**
     * Uploads test results to the Xray instance.
     *
     * @param results - the test results as provided by Cypress
     * @returns the key of the test execution issue
     * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2
     */
    importExecution(execution: XrayTestExecutionResults): Promise<string>;
    /**
     * Uploads (zipped) feature file(s) to corresponding Xray issues.
     *
     * @param file - the (zipped) Cucumber feature file(s)
     * @param query - the query parameters
     * @returns the response containing updated issues
     * @see https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
     * @see https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
     */
    importFeature(
        file: string,
        query: {
            /**
             * The key of the project where the tests and pre-conditions are located.
             */
            projectKey?: string;
            /**
             * The ID of the project where the tests and pre-conditions are located.
             */
            projectId?: string;
            /**
             * A name designating the source of the features being imported (e.g. the source
             * project name).
             */
            source?: string;
        }
    ): Promise<ImportFeatureResponse>;
    /**
     * Uploads Cucumber test results to the Xray instance.
     *
     * @param cucumberJson - the test results as provided by the `cypress-cucumber-preprocessor`
     * @param cucumberInfo - the test execution information
     * @returns the key of the test execution issue
     * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#ImportExecutionResultsREST-CucumberJSONresultsMultipart
     * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2
     */
    importExecutionCucumberMultipart(
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: CucumberMultipartInfo
    ): Promise<string>;
}

/**
 * An abstract Xray client class for communicating with Xray instances.
 */
export abstract class AbstractXrayClient extends Client implements XrayClient {
    public async importExecution(execution: XrayTestExecutionResults): Promise<string> {
        try {
            const authorizationHeader = await this.credentials.getAuthorizationHeader();
            LOG.message(Level.DEBUG, "Importing execution...");
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
                const response: AxiosResponse<
                    ImportExecutionResponseServer | ImportExecutionResponseCloud
                > = await this.httpClient.post(this.getUrlImportExecution(), execution, {
                    headers: {
                        ...authorizationHeader,
                    },
                });
                const key = this.handleResponseImportExecution(response.data);
                LOG.message(Level.DEBUG, `Successfully uploaded test execution results to ${key}.`);
                return key;
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            LOG.message(Level.ERROR, `Failed to import execution: ${errorMessage(error)}`);
            LOG.logErrorToFile(error, "importExecutionError");
            throw new LoggedError("Failed to import Cypress execution results");
        }
    }

    public async importFeature(
        file: string,
        query: {
            projectKey?: string;
            projectId?: string;
            source?: string;
        }
    ): Promise<ImportFeatureResponse> {
        try {
            const authorizationHeader = await this.credentials.getAuthorizationHeader();
            LOG.message(Level.DEBUG, "Importing Cucumber features...");
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
                const fileContent = fs.createReadStream(file);
                const form = new FormData();
                form.append("file", fileContent);

                const response: AxiosResponse<
                    ImportFeatureResponseServer | ImportFeatureResponseCloud
                > = await this.httpClient.post(
                    this.getUrlImportFeature(query.projectKey, query.projectId, query.source),
                    form,
                    {
                        headers: {
                            ...authorizationHeader,
                            ...form.getHeaders(),
                        },
                    }
                );
                return this.handleResponseImportFeature(response.data);
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            LOG.logErrorToFile(error, "importFeatureError");
            if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
                LOG.message(
                    Level.ERROR,
                    dedent(`
                        Failed to import Cucumber features: ${errorMessage(error)}

                        The prefixes in Cucumber background or scenario tags might be inconsistent with the scheme defined in Xray

                        For more information, visit:
                        - ${HELP.plugin.configuration.cucumber.prefixes}
                    `)
                );
            } else {
                LOG.message(
                    Level.ERROR,
                    `Failed to import Cucumber features: ${errorMessage(error)}`
                );
            }
            throw new LoggedError("Feature file import failed");
        }
    }

    public async importExecutionCucumberMultipart(
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: CucumberMultipartInfo
    ): Promise<string> {
        try {
            LOG.message(Level.DEBUG, "Importing execution (Cucumber)...");
            const request = await this.prepareRequestImportExecutionCucumberMultipart(
                cucumberJson,
                cucumberInfo
            );
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
                const response: AxiosResponse<
                    ImportExecutionResponseServer | ImportExecutionResponseCloud
                > = await this.httpClient.post(request.url, request.data, request.config);
                const key = this.handleResponseImportExecutionCucumberMultipart(response.data);
                LOG.message(
                    Level.DEBUG,
                    `Successfully uploaded Cucumber test execution results to ${key}.`
                );
                return key;
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            LOG.message(Level.ERROR, `Failed to import Cucumber execution: ${errorMessage(error)}`);
            LOG.logErrorToFile(error, "importExecutionCucumberMultipartError");
            throw new LoggedError("Failed to import Cucumber execution results");
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
     * Returns the endpoint to use for importing test execution results.
     *
     * @returns the URL
     */
    public abstract getUrlImportExecution(): string;

    /**
     * This method is called when a feature file was successfully imported to Xray.
     *
     * @param response - the import feature response or `undefined` in case of errors
     */
    protected abstract handleResponseImportFeature(
        response: ImportFeatureResponseServer | ImportFeatureResponseCloud
    ): ImportFeatureResponse;

    /**
     * Returns the test execution key from the import execution response.
     *
     * @param response - the import execution response
     * @returns the test execution issue key
     */
    protected abstract handleResponseImportExecution(
        response: ImportExecutionResponseServer | ImportExecutionResponseCloud
    ): string;

    /**
     * Prepares the Cucumber multipart import execution request.
     *
     * @param cucumberJson - the test results as provided by the `cypress-cucumber-preprocessor`
     * @param cucumberInfo - the test execution information
     * @returns the import execution request
     */
    protected abstract prepareRequestImportExecutionCucumberMultipart(
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: CucumberMultipartInfo
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
