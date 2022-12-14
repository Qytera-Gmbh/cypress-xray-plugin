import {
    BasicAuthCredentials,
    HTTPHeader,
    PATCredentials,
} from "../credentials";
import { Requests } from "../https/requests";
import { ImportExecutionResultsResponse } from "../types/xray/responses";
import { XrayExecutionResults } from "../types/xray/xray";
import { Uploader } from "../uploader";

export class ServerAPIUploader extends Uploader<
    BasicAuthCredentials | PATCredentials
> {
    private readonly apiBaseURL: string;

    constructor(
        apiBaseURL: string,
        credentials: BasicAuthCredentials | PATCredentials
    ) {
        super(credentials);
        this.apiBaseURL = apiBaseURL;
        if (this.credentials instanceof BasicAuthCredentials) {
        }
    }

    protected async upload(
        executionResults: XrayExecutionResults
    ): Promise<ImportExecutionResultsResponse> {
        return this.credentials
            .getAuthenticationHeader()
            .then(async (header: HTTPHeader) => {
                console.log(`Uploading test results to ${this.apiBaseURL} ...`);
                const progressInterval = setInterval(() => {
                    console.log("\tStill uploading...");
                }, 5000);
                try {
                    const response = await Requests.post(
                        `${this.apiBaseURL}/import/execution`,
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
                    console.log("Upload failed: ", error);
                    throw new Error("Failed to upload results to Xray Jira");
                } finally {
                    clearInterval(progressInterval);
                }
            });
    }
}
