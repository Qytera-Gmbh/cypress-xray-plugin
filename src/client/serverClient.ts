import {
    BasicAuthCredentials,
    HTTPHeader,
    PATCredentials,
} from "../credentials";
import { Requests } from "../https/requests";
import {
    ExportFeatureFileResponse,
    ImportExecutionResultsResponse,
} from "../types/xray/responses";
import { XrayExecutionResults } from "../types/xray/xray";
import { Client } from "./client";

export class ServerClient extends Client<
    BasicAuthCredentials | PATCredentials
> {
    private readonly apiBaseURL: string;

    constructor(
        apiBaseURL: string,
        credentials: BasicAuthCredentials | PATCredentials
    ) {
        super(credentials);
        this.apiBaseURL = apiBaseURL;
    }

    protected async doImportExecutionResults(
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

    protected doExportCucumberTests(
        keys?: string,
        filter?: number
    ): Promise<ExportFeatureFileResponse> {
        throw new Error("Method not implemented.");
    }
}
