import axios from "axios";
import { HTTPHeader, JWTCredentials } from "../credentials";
import { ImportExecutionResultsResponse } from "../types/xray/responses";
import { XrayExecutionResults } from "../types/xray/xray";
import { Uploader } from "../uploader";

export class CloudAPIUploader extends Uploader<JWTCredentials> {
    /**
     * The URL of Xray's Cloud API.
     * Note: API v1 would also work, but let's stick to the more recent one.
     */
    private static readonly URL = "https://xray.cloud.getxray.app/api/v2";

    protected async upload(
        executionResults: XrayExecutionResults
    ): Promise<ImportExecutionResultsResponse> {
        return this.credentials
            .getAuthenticationHeader({
                authenticationURL: `${CloudAPIUploader.URL}/authenticate`,
            })
            .then(async (header: HTTPHeader) => {
                console.log("Uploading test results...");
                const progressInterval = setInterval(() => {
                    console.log("\tStill uploading...");
                }, 5000);
                try {
                    const response = await axios.post(
                        `${CloudAPIUploader.URL}/import/execution`,
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
}
