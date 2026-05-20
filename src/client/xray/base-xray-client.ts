import { type AxiosResponse, HttpStatusCode, isAxiosError } from "axios";
import FormData from "form-data";
import fs from "fs";
import type { XrayTestExecutionResults } from "../../models/xray/import-test-execution-results";
import type { CucumberMultipartFeature } from "../../models/xray/requests/import-execution-cucumber-multipart";
import type { MultipartInfo } from "../../models/xray/requests/import-execution-multipart-info";
import type { ImportFeatureResponse } from "../../models/xray/responses/import-feature";
import { dedent } from "../../util/dedent";
import { LoggedError, errorMessage } from "../../util/errors";
import { HELP } from "../../util/help";
import { LOG } from "../../util/logging";
import { Client } from "../client";
import { loggedRequest } from "../util";
import type {
    HasImportExecutionCucumberMultipartEndpoint,
    HasImportExecutionEndpoint,
    HasImportExecutionMultipartEndpoint,
    HasImportFeatureEndpoint,
} from "./xray-client";

/**
 * An abstract Xray client class for communicating with Xray instances.
 */
export abstract class BaseXrayClient<ImportFeatureResponseType, ImportExecutionResponseType>
    extends Client
    implements
        HasImportExecutionCucumberMultipartEndpoint,
        HasImportExecutionEndpoint,
        HasImportExecutionMultipartEndpoint,
        HasImportFeatureEndpoint
{
    @loggedRequest({ purpose: "import Cypress results" })
    public async importExecution(execution: XrayTestExecutionResults): Promise<string> {
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        LOG.message("info", "Importing Cypress execution...");
        const response: AxiosResponse<ImportExecutionResponseType> = await this.httpClient.post(
            this.getUrlImportExecution(),
            execution,
            {
                headers: {
                    ...authorizationHeader,
                },
            }
        );
        const key = this.onResponse("import-execution", response.data);
        LOG.message("debug", `Successfully uploaded test execution results to ${key}.`);
        return key;
    }

    @loggedRequest({ purpose: "import Cypress results" })
    public async importExecutionMultipart(
        executionResults: XrayTestExecutionResults,
        info: MultipartInfo
    ): Promise<string> {
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        LOG.message("info", "Importing Cypress execution...");
        const formData = this.onRequest("import-execution-multipart", executionResults, info);
        const response: AxiosResponse<ImportExecutionResponseType> = await this.httpClient.post(
            this.getUrlImportExecutionMultipart(),
            formData,
            {
                headers: {
                    ...authorizationHeader,
                    ...formData.getHeaders(),
                },
            }
        );
        const key = this.onResponse("import-execution-multipart", response.data);
        LOG.message("debug", `Successfully uploaded test execution results to ${key}.`);
        return key;
    }

    @loggedRequest({ purpose: "import Cucumber results" })
    public async importExecutionCucumberMultipart(
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: MultipartInfo
    ): Promise<string> {
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        LOG.message("info", "Importing Cucumber execution...");
        const formData = this.onRequest(
            "import-execution-cucumber-multipart",
            cucumberJson,
            cucumberInfo
        );
        const response: AxiosResponse<ImportExecutionResponseType> = await this.httpClient.post(
            this.getUrlImportExecutionCucumberMultipart(),
            formData,
            {
                headers: {
                    ...authorizationHeader,
                    ...formData.getHeaders(),
                },
            }
        );
        const key = this.onResponse("import-execution-cucumber-multipart", response.data);
        LOG.message("debug", `Successfully uploaded Cucumber test execution results to ${key}.`);
        return key;
    }

    public async importFeature(
        file: string,
        query: {
            projectId?: string;
            projectKey?: string;
            source?: string;
        }
    ): Promise<ImportFeatureResponse> {
        try {
            const authorizationHeader = await this.credentials.getAuthorizationHeader();
            LOG.message("debug", "Importing Cucumber features...");
            const formData = new FormData();
            formData.append("file", fs.createReadStream(file));

            const response: AxiosResponse<ImportFeatureResponseType> = await this.httpClient.post(
                this.getUrlImportFeature(query.projectKey, query.projectId, query.source),
                formData,
                {
                    headers: {
                        ...authorizationHeader,
                        ...formData.getHeaders(),
                    },
                }
            );
            return this.onResponse("import-feature", response.data);
        } catch (error: unknown) {
            LOG.logErrorToFile(error, "importFeatureError");
            if (isAxiosError(error) && error.response?.status === HttpStatusCode.BadRequest) {
                LOG.message(
                    "error",
                    dedent(`
                        Failed to import Cucumber features: ${errorMessage(error)}

                          The prefixes in Cucumber background or scenario tags might not be consistent with the scheme defined in Xray.

                          For more information, visit:
                          - ${HELP.plugin.configuration.cucumber.prefixes}
                    `)
                );
            } else {
                LOG.message("error", `Failed to import Cucumber features: ${errorMessage(error)}`);
            }
            throw new LoggedError("Feature file import failed");
        }
    }

    private getUrlImportFeature(projectKey?: string, projectId?: string, source?: string): string {
        const query: string[] = [];
        if (projectKey) {
            query.push(`projectKey=${projectKey}`);
        }
        if (projectId) {
            query.push(`projectId=${projectId}`);
        }
        if (source) {
            query.push(`source=${source}`);
        }
        return `${this.apiBaseUrl}/import/feature?${query.join("&")}`;
    }

    private getUrlImportExecution(): string {
        return `${this.apiBaseUrl}/import/execution`;
    }

    private getUrlImportExecutionCucumberMultipart(): string {
        return `${this.apiBaseUrl}/import/execution/cucumber/multipart`;
    }

    private getUrlImportExecutionMultipart(): string {
        return `${this.apiBaseUrl}/import/execution/multipart`;
    }

    /**
     * Prepares the Cucumber multipart import execution form data.
     *
     * @param event - the event
     * @param cucumberJson - the test results as provided by the `cypress-cucumber-preprocessor`
     * @param cucumberInfo - the test execution information
     * @returns the form data
     */
    protected abstract onRequest(
        event: "import-execution-cucumber-multipart",
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: MultipartInfo
    ): FormData;

    /**
     * Prepares the import execution multipart form data.
     *
     * @param event - the event
     * @param executionResults - the test results as provided by Cypress
     * @param info - the Jira test execution issue information
     * @returns the form data
     */
    protected abstract onRequest(
        event: "import-execution-multipart",
        executionResults: XrayTestExecutionResults,
        info: MultipartInfo
    ): FormData;

    /**
     * Handles the import feature response and transforms it into a consolidated object.
     *
     * @param event - the event
     * @param response - the response depending on the concrete Xray version
     * @returns the consolidated response
     */
    protected abstract onResponse(
        event: "import-feature",
        response: ImportFeatureResponseType
    ): ImportFeatureResponse;

    /**
     * Handles the import execution results response and transforms it into a consolidated object.
     *
     * @param event - the event
     * @param response - the response depending on the concrete Xray version
     * @returns the test execution issue key
     */
    protected abstract onResponse(
        event:
            | "import-execution-cucumber-multipart"
            | "import-execution-multipart"
            | "import-execution",
        response: ImportExecutionResponseType
    ): string;
}
