import axios from "axios";
import fs from "fs";
import { HTTPHeader, JWTCredentials } from "../credentials";
import {
    ExportFeatureFileResponse,
    ImportExecutionResultsResponse,
} from "../types/xray/responses";
import { XrayExecutionResults } from "../types/xray/xray";
import { Client } from "./client";

export class CloudClient extends Client<JWTCredentials> {
    /**
     * The URL of Xray's Cloud API.
     * Note: API v1 would also work, but let's stick to the more recent one.
     */
    private static readonly URL = "https://xray.cloud.getxray.app/api/v2";

    protected async doImportExecutionResults(
        executionResults: XrayExecutionResults
    ): Promise<ImportExecutionResultsResponse> {
        return this.credentials
            .getAuthenticationHeader({
                authenticationURL: `${CloudClient.URL}/authenticate`,
            })
            .then(async (header: HTTPHeader) => {
                console.log("Uploading test results...");
                const progressInterval = setInterval(() => {
                    console.log("\tStill uploading...");
                }, 5000);
                try {
                    const response = await axios.post(
                        `${CloudClient.URL}/import/execution`,
                        executionResults,
                        {
                            headers: {
                                ...header,
                            },
                        }
                    );
                    console.log(
                        "Successfully uploaded test execution results:",
                        response.data
                    );
                    return response.data;
                } catch (error: unknown) {
                    if (axios.isAxiosError(error)) {
                        throw new Error(
                            `Failed to upload results to Xray Jira: "${error.response.data.error}"`
                        );
                    }
                    throw new Error(
                        `Failed to upload results to Xray Jira: "${error}"`
                    );
                } finally {
                    clearInterval(progressInterval);
                }
            });
    }

    protected async doExportCucumberTests(
        keys?: string,
        filter?: number
    ): Promise<ExportFeatureFileResponse> {
        const header = await this.credentials.getAuthenticationHeader({
            authenticationURL: `${CloudClient.URL}/authenticate`,
        });
        console.log("Exporting cucumber tests...");
        const progressInterval = setInterval(() => {
            console.log("\tStill exporting...");
        }, 5000);
        try {
            const response = await axios.get(
                `${CloudClient.URL}/export/cucumber`,
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
                    console.error(
                        `Failed to export cucumber feature files: "${error}"`
                    );
                }
            );
            console.log(`Successfully exporter cucumber tests to ${filename}`);
            return response.data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `Failed to upload results to Xray Jira: "${error.response.data.error}"`
                );
            }
            throw new Error(
                `Failed to upload results to Xray Jira: "${error}"`
            );
        } finally {
            clearInterval(progressInterval);
        }
    }
}
