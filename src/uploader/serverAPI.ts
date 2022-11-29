import axios from "axios";
import {
    BasicAuthCredentials,
    HTTPHeader,
    PATCredentials,
} from "../credentials";
import { ImportExecutionResultsResponse } from "../types/xray/responses";
import { XrayExecutionResults } from "../types/xray/xray";
import { Uploader } from "../uploader";

export class ServerAPIUploader extends Uploader<
    BasicAuthCredentials | PATCredentials
> {
    private readonly apiBaseURL: string;

    constructor(
        apiBaseURL: string,
        credentials: BasicAuthCredentials | PATCredentials,
        projectKey: string
    ) {
        super(credentials, projectKey);
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
                console.log("Uploading test results...");
                const progressInterval = setInterval(() => {
                    console.log("\tStill uploading...");
                }, 5000);
                try {
                    const response = await axios.post(
                        `${this.apiBaseURL}/import/execution`,
                        executionResults,
                        {
                            headers: {
                                ...header,
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
