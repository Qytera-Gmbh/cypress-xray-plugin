import { AxiosResponse } from "axios";
import FormData from "form-data";
import fs from "fs";
import { HTTPHeader, JWTCredentials } from "../../authentication/credentials";
import { ImportExecutionResultsConverterCloud } from "../../conversion/importExecutionResults/importExecutionResultsConverterCloud";
import { Requests } from "../../https/requests";
import { logError, logInfo, logSuccess, writeErrorFile } from "../../logging/logging";
import { InternalOptions } from "../../types/plugin";
import { XrayTestExecutionResultsCloud } from "../../types/xray/importTestExecutionResults";
import { ExportCucumberTestsResponse } from "../../types/xray/responses/exportFeature";
import { ImportFeatureResponseCloud, IssueDetails } from "../../types/xray/responses/importFeature";
import { XrayClient } from "./xrayClient";

export class XrayClientCloud extends XrayClient<JWTCredentials, ImportFeatureResponseCloud> {
    /**
     * The URL of Xray's Cloud API.
     * Note: API v1 would also work, but let's stick to the more recent one.
     */
    private static readonly URL = "https://xray.cloud.getxray.app/api/v2";
    private readonly options: InternalOptions;

    /**
     * Construct a new Xray Cloud client.
     *
     * @param credentials the credentials to use during authentication
     * @param options the plugin's options
     */
    constructor(credentials: JWTCredentials, options: InternalOptions) {
        super(credentials);
        this.options = options;
    }

    protected async dispatchImportTestExecutionResultsRequest(
        results: CypressCommandLine.CypressRunResult
    ): Promise<string | null> {
        const json: XrayTestExecutionResultsCloud = new ImportExecutionResultsConverterCloud(
            this.options
        ).convertExecutionResults(results);
        if (!json.tests || json.tests.length === 0) {
            return null;
        }
        return this.credentials
            .getAuthenticationHeader(`${XrayClientCloud.URL}/authenticate`)
            .catch((error: unknown) => {
                logError(`Failed to authenticate: "${error}"`);
                writeErrorFile(error, "authenticationError");
                throw error;
            })
            .then(async (header: HTTPHeader) => {
                logInfo("Uploading test results...");
                const progressInterval = this.startResponseInterval(XrayClientCloud.URL);
                try {
                    const response = await Requests.post(
                        `${XrayClientCloud.URL}/import/execution`,
                        json,
                        {
                            headers: {
                                ...header,
                            },
                        }
                    );
                    logSuccess(
                        `Successfully uploaded test execution results to ${response.data.key}.`
                    );
                    return response.data.key;
                } finally {
                    clearInterval(progressInterval);
                }
            });
    }

    protected async dispatchExportCucumberTestsRequest(
        keys?: string,
        filter?: number
    ): Promise<ExportCucumberTestsResponse> {
        const header = await this.credentials.getAuthenticationHeader(
            `${XrayClientCloud.URL}/authenticate`
        );
        logInfo("Exporting cucumber tests...");
        const progressInterval = setInterval(() => {
            logInfo("Still exporting...");
        }, 5000);
        try {
            const response = await Requests.get(`${XrayClientCloud.URL}/export/cucumber`, {
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
    }

    protected async dispatchImportCucumberTestsRequest(
        file: string,
        projectKey?: string,
        projectId?: string,
        source?: string
    ): Promise<ImportFeatureResponseCloud> {
        const header = await this.credentials.getAuthenticationHeader(
            `${XrayClientCloud.URL}/authenticate`
        );
        logInfo("Importing cucumber feature file...");
        const progressInterval = setInterval(() => {
            logInfo("Still importing...");
        }, 5000);
        try {
            const fileContent = fs.createReadStream(file);
            const form = new FormData();
            form.append("file", fileContent);

            const response: AxiosResponse<ImportFeatureResponseCloud> = await Requests.post(
                `${XrayClientCloud.URL}/import/feature`,
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
                logError("Encountered some errors during import:", ...response.data.errors);
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
    }
}
