import FormData from "form-data";
import fs from "fs";
import { HTTPHeader, JWTCredentials } from "../../authentication/credentials";
import { ImportExecutionResultsConverterCloud } from "../../conversion/importExecutionResults/importExecutionResultsConverterCloud";
import { Requests } from "../../https/requests";
import { logError, logInfo, logSuccess } from "../../logging/logging";
import { XrayTestExecutionResultsCloud } from "../../types/xray/importTestExecutionResults";
import {
    ExportCucumberTestsResponse,
    ImportCucumberTestsResponse,
} from "../../types/xray/responses";
import { XrayClient } from "./xrayClient";

export class XrayClientCloud extends XrayClient<JWTCredentials> {
    /**
     * The URL of Xray's Cloud API.
     * Note: API v1 would also work, but let's stick to the more recent one.
     */
    private static readonly URL = "https://xray.cloud.getxray.app/api/v2";

    public async dispatchImportTestExecutionResultsRequest(
        results: CypressCommandLine.CypressRunResult
    ): Promise<string> {
        const json: XrayTestExecutionResultsCloud =
            new ImportExecutionResultsConverterCloud().convertExecutionResults(
                results
            );
        return this.credentials
            .getAuthenticationHeader({
                authenticationURL: `${XrayClientCloud.URL}/authenticate`,
            })
            .then(async (header: HTTPHeader) => {
                logInfo("Uploading test results...");
                const progressInterval = setInterval(() => {
                    logInfo("Still uploading...");
                }, 5000);
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

    public async dispatchExportCucumberTestsRequest(
        keys?: string,
        filter?: number
    ): Promise<ExportCucumberTestsResponse> {
        const header = await this.credentials.getAuthenticationHeader({
            authenticationURL: `${XrayClientCloud.URL}/authenticate`,
        });
        logInfo("Exporting cucumber tests...");
        const progressInterval = setInterval(() => {
            logInfo("Still exporting...");
        }, 5000);
        try {
            const response = await Requests.get(
                `${XrayClientCloud.URL}/export/cucumber`,
                {
                    headers: {
                        ...header,
                    },
                    params: {
                        keys: keys,
                        filter: filter,
                    },
                }
            );
            // Extract filename from response.
            const contentDisposition = response.headers["Content-Disposition"];
            const filenameStart = contentDisposition.indexOf('"');
            const filenameEnd = contentDisposition.lastIndexOf('"');
            const filename = contentDisposition.substring(
                filenameStart,
                filenameEnd
            );
            fs.writeFile(
                filename,
                response.data,
                (error: NodeJS.ErrnoException | null) => {
                    throw new Error(
                        `Failed to export cucumber feature files: "${error}"`
                    );
                }
            );
            throw new Error("Method not implemented.");
        } finally {
            clearInterval(progressInterval);
        }
    }

    public async dispatchImportCucumberTestsRequest(
        file: string,
        projectKey?: string,
        projectId?: string,
        source?: string
    ): Promise<ImportCucumberTestsResponse> {
        const header = await this.credentials.getAuthenticationHeader({
            authenticationURL: `${XrayClientCloud.URL}/authenticate`,
        });
        logInfo("Importing cucumber feature files...");
        const progressInterval = setInterval(() => {
            logInfo("Still importing...");
        }, 5000);
        try {
            const fileContent = fs.createReadStream(file);
            const form = new FormData();
            form.append("file", fileContent);

            const response = await Requests.post(
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
            if (response.data.updatedOrCreatedTests.length > 0) {
                logSuccess(
                    "Successfully updated or created test issues:",
                    JSON.stringify(response.data.updatedOrCreatedTests)
                );
            }
            if (response.data.updatedOrCreatedPreconditions.length > 0) {
                logSuccess(
                    "Successfully updated or created precondition issues:",
                    JSON.stringify(response.data.updatedOrCreatedPreconditions)
                );
            }
            if (response.data.errors.length > 0) {
                logError(
                    "Encountered some errors during import:",
                    JSON.stringify(response.data.errors)
                );
            }
            return response.data;
        } finally {
            clearInterval(progressInterval);
        }
    }
}
