import { AxiosResponse } from "axios";
import FormData from "form-data";
import fs from "fs";
import { BasicAuthCredentials, HTTPHeader, PATCredentials } from "../../authentication/credentials";
import { ImportExecutionResultsConverterServer } from "../../conversion/importExecutionResults/importExecutionResultsConverterServer";
import { Requests } from "../../https/requests";
import { logError, logInfo, logSuccess, writeErrorFile } from "../../logging/logging";
import { InternalOptions } from "../../types/plugin";
import { XrayTestExecutionResultsServer } from "../../types/xray/importTestExecutionResults";
import { ExportCucumberTestsResponse } from "../../types/xray/responses/exportFeature";
import {
    ImportFeatureResponseServer,
    IssueDetails,
} from "../../types/xray/responses/importFeature";
import { XrayClient } from "./xrayClient";

export class XrayClientServer extends XrayClient<
    BasicAuthCredentials | PATCredentials,
    ImportFeatureResponseServer
> {
    private readonly apiBaseURL: string;
    private readonly options: InternalOptions;

    /**
     * Construct a new Xray Server client.
     *
     * @param apiBaseURL the Xray server base endpoint
     * @param credentials the credentials to use during authentication
     * @param options the plugin's options
     */
    constructor(
        apiBaseURL: string,
        credentials: BasicAuthCredentials | PATCredentials,
        options: InternalOptions
    ) {
        super(credentials);
        this.apiBaseURL = apiBaseURL;
        this.options = options;
    }

    protected async dispatchImportTestExecutionResultsRequest(
        results: CypressCommandLine.CypressRunResult
    ): Promise<string | null> {
        const json: XrayTestExecutionResultsServer = new ImportExecutionResultsConverterServer(
            this.options
        ).convertExecutionResults(results);
        if (!json.tests || json.tests.length === 0) {
            return null;
        }
        return this.credentials
            .getAuthenticationHeader()
            .catch((error: unknown) => {
                logError(`Failed to authenticate: "${error}"`);
                writeErrorFile(error, "authenticationError");
                throw error;
            })
            .then(async (header: HTTPHeader) => {
                logInfo(`Uploading test results to ${this.apiBaseURL}...`);
                const progressInterval = this.startResponseInterval(this.apiBaseURL);
                try {
                    const response = await Requests.post(
                        `${this.apiBaseURL}/rest/raven/latest/api/import/execution`,
                        json,
                        {
                            headers: {
                                ...header,
                            },
                        }
                    );
                    logSuccess(
                        `Successfully uploaded test execution results to ${response.data.testExecIssue.key}.`
                    );
                    return response.data.testExecIssue.key;
                } finally {
                    clearInterval(progressInterval);
                }
            });
    }

    protected dispatchExportCucumberTestsRequest(
        keys?: string,
        filter?: number
    ): Promise<ExportCucumberTestsResponse> {
        throw new Error("Method not implemented.");
    }

    protected async dispatchImportCucumberTestsRequest(
        file: string,
        projectKey?: string
    ): Promise<ImportFeatureResponseServer> {
        const header = await this.credentials.getAuthenticationHeader();
        logInfo("Importing cucumber feature file...");
        const progressInterval = setInterval(() => {
            logInfo("Still importing...");
        }, 5000);
        try {
            const fileContent = fs.createReadStream(file);
            const form = new FormData();
            form.append("file", fileContent);

            const response: AxiosResponse<ImportFeatureResponseServer> =
                await Requests.post<FormData>(
                    `${this.apiBaseURL}/rest/raven/latest/import/feature?projectKey=${projectKey}`,
                    form,
                    {
                        headers: {
                            ...header,
                            ...form.getHeaders(),
                        },
                    }
                );
            // Happens when scenarios cause errors in Xray.
            // E.g. typos in Gherkin keywords ('Scenariot').
            if (typeof response.data === "object" && "message" in response.data) {
                if (response.data.message) {
                    logError("Encountered an error during import:", response.data.message);
                }
                if (response.data.testIssues.length > 0) {
                    logSuccess(
                        "Successfully updated or created test issues:",
                        response.data.testIssues.map((issue: IssueDetails) => issue.key).join(", ")
                    );
                }
                if (response.data.preconditionIssues.length > 0) {
                    logSuccess(
                        "Successfully updated or created precondition issues:",
                        response.data.preconditionIssues
                            .map((issue: IssueDetails) => issue.key)
                            .join(", ")
                    );
                }
            } else if (Array.isArray(response.data)) {
                logSuccess(
                    "Successfully updated or created issues:",
                    response.data.map((issue: IssueDetails) => issue.key).join(", ")
                );
            }
            return response.data;
        } finally {
            clearInterval(progressInterval);
        }
    }
}
