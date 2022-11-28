import axios, { AxiosError, AxiosResponse } from "axios";
import { APIv2Credentials } from "../types/types";
import { ImportExecutionResultsResponse } from "../types/xray/responses";
import { XrayExecutionResults } from "../types/xray/xray";
import { Uploader } from "../uploader";

export class CloudAPIv2Uploader extends Uploader<APIv2Credentials> {
    private static readonly URL = "https://xray.cloud.getxray.app/api/v2";

    private token?: string;

    constructor(credentials: APIv2Credentials, projectKey: string) {
        super(credentials, projectKey);
        this.token = undefined;
    }

    protected async getToken(): Promise<string> {
        if (!this.token) {
            console.log(
                `Authenticating against: ${CloudAPIv2Uploader.URL}/authenticate ...`
            );
            return axios
                .post(`${CloudAPIv2Uploader.URL}/authenticate`, {
                    client_id: this.credentials.clientId,
                    client_secret: this.credentials.clientSecret,
                })
                .then((response: AxiosResponse) => {
                    console.log("Authentication successful.");
                    this.token = response.data;
                    return this.token;
                })
                .catch((error: AxiosError) => {
                    throw new Error(
                        `Failed to authenticate to Jira Xray: ${error}`
                    );
                });
        }
        return this.token;
    }

    protected async upload(
        executionResults: XrayExecutionResults
    ): Promise<ImportExecutionResultsResponse> {
        return this.getToken().then(async (token) => {
            console.log("Uploading test results...");
            const progressInterval = setInterval(() => {
                console.log("\tStill uploading...");
            }, 5000);
            try {
                const response = await axios.post(
                    `${CloudAPIv2Uploader.URL}/import/execution`,
                    executionResults,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                return response.data;
            } finally {
                clearInterval(progressInterval);
            }
        });
    }
}
