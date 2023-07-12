import { AxiosResponse } from "axios";
import FormData from "form-data";
import fs from "fs";
import {
    BasicAuthCredentials,
    HTTPHeader,
    JWTCredentials,
    PATCredentials,
} from "../../authentication/credentials";
import { Requests } from "../../https/requests";
import { logError, logInfo, logSuccess, logWarning } from "../../logging/logging";
import { OneOf } from "../../types/util";
import {
    XrayTestExecutionResultsCloud,
    XrayTestExecutionResultsServer,
} from "../../types/xray/importTestExecutionResults";
import { CucumberMultipart } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { ExportCucumberTestsResponse } from "../../types/xray/responses/exportFeature";
import {
    ImportFeatureResponseCloud,
    ImportFeatureResponseServer,
    IssueDetails,
} from "../../types/xray/responses/importFeature";
import { Client } from "../client";

/**
 * An abstract Xray client class for communicating with Xray instances.
 */
export abstract class XrayClient<
    I extends OneOf<[ImportFeatureResponseServer, ImportFeatureResponseCloud]>,
    ImportExecutionResponseType,
    CucumberMultipartInfoType
> extends Client<BasicAuthCredentials | PATCredentials | JWTCredentials> {
    /**
     * Uploads test results to the Xray instance.
     *
     * @param results the test results as provided by Cypress
     * @returns the key of the test execution issue or null if the upload was skipped
     * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2
     */
    public async importExecution<
        R extends OneOf<[XrayTestExecutionResultsServer, XrayTestExecutionResultsCloud]>
    >(execution: R): Promise<string | null> {
        try {
            if (!execution.tests || execution.tests.length === 0) {
                logWarning("No tests linked to Xray were executed. Skipping upload.");
                return null;
            }
            return this.credentials
                .getAuthenticationHeader(`${this.apiBaseURL}/authenticate`)
                .catch((error: unknown) => {
                    logError(`Failed to authenticate: "${error}"`);
                    this.writeErrorFile(error, "authentication");
                    throw error;
                })
                .then(async (header: HTTPHeader) => {
                    logInfo("Importing execution...");
                    const progressInterval = this.startResponseInterval(this.apiBaseURL);
                    try {
                        const response: AxiosResponse<ImportExecutionResponseType> =
                            await Requests.post(this.getUrlImportExecution(), execution, {
                                headers: {
                                    ...header,
                                },
                            });
                        const key = this.parseResponseImportExecution(response.data);
                        logSuccess(`Successfully uploaded test execution results to ${key}.`);
                        return key;
                    } finally {
                        clearInterval(progressInterval);
                    }
                });
        } catch (error: unknown) {
            logError(`Failed to upload results to Xray: "${error}"`);
            this.writeErrorFile(error, "importExecution");
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
     * @param response the import execution response
     */
    public abstract parseResponseImportExecution(response: ImportExecutionResponseType): string;

    /**
     * Downloads feature (file) specifications from corresponding Xray issues.
     *
     * @param keys a list of issue keys
     * @param filter an integer that represents the filter ID
     * @returns the response of the Xray instance
     * @see https://docs.getxray.app/display/XRAYCLOUD/Exporting+Cucumber+Tests+-+REST+v2
     */
    public async exportCucumberTests(
        keys?: string[],
        filter?: number
    ): Promise<ExportCucumberTestsResponse> {
        return this.credentials
            .getAuthenticationHeader(`${this.apiBaseURL}/authenticate`)
            .catch((error: unknown) => {
                logError(`Failed to authenticate: "${error}"`);
                this.writeErrorFile(error, "authentication");
                throw error;
            })
            .then(async (header: HTTPHeader) => {
                logInfo("Exporting cucumber tests...");
                const progressInterval = this.startResponseInterval(this.apiBaseURL);
                try {
                    const response = await Requests.get(this.getUrlExportCucumber(keys, filter), {
                        headers: {
                            ...header,
                        },
                        params: {
                            keys: keys,
                            filter: filter,
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
                    throw new Error("Method not implemented.");
                } finally {
                    clearInterval(progressInterval);
                }
            });
    }

    /**
     * Returns the endpoint to use for exporting Cucumber feature files.
     *
     * @param keys a list of issue keys
     * @param filter an integer that represents the filter ID
     * @returns the URL
     */
    public abstract getUrlExportCucumber(issueKeys?: string[], filter?: number): string;

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
            return this.credentials
                .getAuthenticationHeader(`${this.apiBaseURL}/authenticate`)
                .catch((error: unknown) => {
                    logError(`Failed to authenticate: "${error}"`);
                    this.writeErrorFile(error, "authentication");
                    throw error;
                })
                .then(async (header: HTTPHeader) => {
                    logInfo("Importing Cucumber tests...");
                    const progressInterval = this.startResponseInterval(this.apiBaseURL);
                    try {
                        const fileContent = fs.createReadStream(file);
                        const form = new FormData();
                        form.append("file", fileContent);

                        const response: AxiosResponse<I> = await Requests.post(
                            this.getUrlImportFeature(projectKey),
                            form,
                            {
                                headers: {
                                    ...header,
                                    ...form.getHeaders(),
                                },
                                params: {
                                    projectKey: projectKey,
                                    projectId: projectId,
                                    source: source,
                                },
                            }
                        );
                        if (response.data.errors.length > 0) {
                            logError(
                                "Encountered some errors during import:",
                                ...response.data.errors
                            );
                        }
                        if (response.data.updatedOrCreatedTests.length > 0) {
                            logSuccess(
                                "Successfully updated or created test issues:",
                                response.data.updatedOrCreatedTests
                                    .map((issue: IssueDetails) => issue.key)
                                    .join(", ")
                            );
                        }
                        if (response.data.updatedOrCreatedPreconditions.length > 0) {
                            logSuccess(
                                "Successfully updated or created precondition issues:",
                                response.data.updatedOrCreatedPreconditions
                                    .map((issue: IssueDetails) => issue.key)
                                    .join(", ")
                            );
                        }
                        return response.data;
                    } finally {
                        clearInterval(progressInterval);
                    }
                });
        } catch (error: unknown) {
            logError(`Failed to import cucumber feature files: "${error}"`);
            this.writeErrorFile(error, "importFeature");
        }
    }

    /**
     * Returns the endpoint to use for importing Cucumber feature files.
     *
     * @param projectKey project where the tests and pre-conditions are going to be created
     * @returns the URL
     */
    public abstract getUrlImportFeature(projectKey: string): string;

    /**
     * Uploads Cucumber test results to the Xray instance.
     *
     * @param results the test results as provided by the `cypress-cucumber-preprocessor`
     * @returns the key of the test execution issue or null if the upload was skipped
     * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#ImportExecutionResultsREST-CucumberJSONresultsMultipart
     * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2
     */
    public async importExecutionCucumberMultipart(
        cucumberJson: CucumberMultipart,
        cucumberInfo: CucumberMultipartInfoType
    ) {
        try {
            if (cucumberJson.length === 0) {
                logWarning("No Cucumber tests were executed. Skipping upload.");
                return null;
            }

            const formData = new FormData();
            const resultString = JSON.stringify(cucumberJson);
            const infoString = JSON.stringify(cucumberInfo);
            formData.append("results", resultString, {
                filename: "results.json",
            });
            formData.append("info", infoString, {
                filename: "info.json",
            });
            return this.credentials
                .getAuthenticationHeader(`${this.apiBaseURL}/authenticate`)
                .catch((error: unknown) => {
                    logError(`Failed to authenticate: "${error}"`);
                    this.writeErrorFile(error, "authentication");
                    throw error;
                })
                .then(async (header: HTTPHeader) => {
                    logInfo("Importing execution (Cucumber)...");
                    const progressInterval = this.startResponseInterval(this.apiBaseURL);
                    try {
                        const response: AxiosResponse<ImportExecutionResponseType> =
                            await Requests.post(this.getUrlImportExecution(), formData, {
                                headers: {
                                    ...header,
                                    ...formData.getHeaders(),
                                },
                            });
                        const key = this.parseResponseImportExecutionCucumberMultipart(
                            response.data
                        );
                        logSuccess(
                            `Successfully uploaded Cucumber test execution results to ${key}.`
                        );
                        return key;
                    } finally {
                        clearInterval(progressInterval);
                    }
                });
        } catch (error: unknown) {
            logError(`Failed to upload Cucumber results to Xray: "${error}"`);
            this.writeErrorFile(error, "importExecutionCucumberMultipart");
        }
    }

    /**
     * Returns the test execution key from the Cucumber multipart import execution response.
     *
     * @param response the import execution response
     */
    public abstract parseResponseImportExecutionCucumberMultipart(
        response: ImportExecutionResponseType
    ): string;
}
