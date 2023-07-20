import { AxiosResponse } from "axios";
import FormData from "form-data";
import fs from "fs";
import {
    BasicAuthCredentials,
    JWTCredentials,
    PATCredentials,
} from "../../authentication/credentials";
import { Requests } from "../../https/requests";
import { logError, logInfo, logSuccess, logWarning, writeErrorFile } from "../../logging/logging";
import { OneOf } from "../../types/util";
import {
    XrayTestExecutionResultsCloud,
    XrayTestExecutionResultsServer,
} from "../../types/xray/importTestExecutionResults";
import { ExportCucumberTestsResponse } from "../../types/xray/responses/exportFeature";
import { Client } from "../client";
import { JiraClientCloud } from "../jira/jiraClientCloud";
import { JiraClientServer } from "../jira/jiraClientServer";

/**
 * An abstract Xray client class for communicating with Xray instances.
 */
export abstract class XrayClient<
    CredentialsType extends BasicAuthCredentials | PATCredentials | JWTCredentials,
    JiraClientType extends JiraClientServer | JiraClientCloud,
    ImportFeatureResponseType,
    ImportExecutionResponseType
> extends Client<CredentialsType> {
    /**
     * The configured Jira client.
     */
    protected readonly jiraClient: JiraClientType;
    /**
     * Construct a new client using the provided credentials.
     *
     * @param apiBaseUrl the base URL for all HTTP requests
     * @param credentials the credentials to use during authentication
     * @param jiraClient the configured Jira client
     */
    constructor(apiBaseUrl: string, credentials: CredentialsType, jiraClient: JiraClientType) {
        super(apiBaseUrl, credentials);
        this.jiraClient = jiraClient;
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
        R extends OneOf<[XrayTestExecutionResultsServer, XrayTestExecutionResultsCloud]>
    >(execution: R): Promise<string | null | undefined> {
        try {
            if (!execution.tests || execution.tests.length === 0) {
                logWarning("No native Cypress tests were executed. Skipping native upload.");
                return null;
            }
            const authenticationHeader = await this.credentials.getAuthenticationHeader(
                `${this.apiBaseURL}/authenticate`
            );
            logInfo("Importing execution...");
            const progressInterval = this.startResponseInterval(this.apiBaseURL);
            try {
                const response: AxiosResponse<ImportExecutionResponseType> = await Requests.post(
                    this.getUrlImportExecution(),
                    execution,
                    {
                        headers: {
                            ...authenticationHeader,
                        },
                    }
                );
                const key = this.handleResponseImportExecution(response.data);
                logSuccess(`Successfully uploaded test execution results to ${key}.`);
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
     * @param response the import execution response
     * @returns the test execution issue key
     */
    public abstract handleResponseImportExecution(response: ImportExecutionResponseType): string;

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
            const authenticationHeader = await this.credentials.getAuthenticationHeader(
                `${this.apiBaseURL}/authenticate`
            );
            logInfo("Exporting Cucumber tests...");
            const progressInterval = this.startResponseInterval(this.apiBaseURL);
            try {
                const response = await Requests.get(this.getUrlExportCucumber(keys, filter), {
                    headers: {
                        ...authenticationHeader,
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
     * @see https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
     * @see https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
     */
    public async importFeature(
        file: string,
        projectKey?: string,
        projectId?: string,
        source?: string
    ): Promise<void> {
        try {
            const authenticationHeader = await this.credentials.getAuthenticationHeader(
                `${this.apiBaseURL}/authenticate`
            );
            logInfo("Importing Cucumber tests...");
            const progressInterval = this.startResponseInterval(this.apiBaseURL);
            try {
                const fileContent = fs.createReadStream(file);
                const form = new FormData();
                form.append("file", fileContent);

                const response: AxiosResponse<ImportFeatureResponseType> = await Requests.post(
                    this.getUrlImportFeature(projectKey, projectId, source),
                    form,
                    {
                        headers: {
                            ...authenticationHeader,
                            ...form.getHeaders(),
                        },
                    }
                );
                this.handleResponseImportFeature(response.data);
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            logError(`Failed to import cucumber feature files: ${error}`);
            writeErrorFile(error, "importFeatureError");
        }
    }

    /**
     * Returns the endpoint to use for importing Cucumber feature files.
     *
     * @param projectKey key of the project where the tests and pre-conditions are going to be created
     * @param projectId id of the project where the tests and pre-conditions are going to be created
     * @param source a name designating the source of the features being imported (e.g. the source project name)
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
     * @param response the import feature response
     */
    public abstract handleResponseImportFeature(response: ImportFeatureResponseType): void;

    /**
     * Returns Xray test types for the provided test issues, such as `Manual`, `Cucumber` or
     * `Generic`.
     *
     * @param projectKey key of the project containing the test issues
     * @param issueKeys the keys of the test issues to retrieve test types for
     * @returns a promise which will contain the mapping of issues to test types, `null` if the
     * upload was skipped or `undefined` in case of errors
     */
    public abstract getTestTypes(
        projectKey: string,
        ...issueKeys: string[]
    ): Promise<{ [key: string]: string }>;
}
