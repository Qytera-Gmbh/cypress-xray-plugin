import { UploadContext } from "./context";
import { toXrayJSON } from "./conversion/conversion";
import { APICredentials, APICredentialsOptions } from "./credentials";
import { ImportExecutionResultsResponse } from "./types/xray/responses";
import { XrayExecutionResults } from "./types/xray/xray";

export abstract class Uploader<
    T extends APICredentials<APICredentialsOptions>
> {
    protected readonly credentials: T;
    private readonly projectKey: string;

    constructor(credentials: T, projectKey: string) {
        this.credentials = credentials;
        this.projectKey = projectKey;
        UploadContext.PROJECT_KEY = projectKey;
    }

    protected getProjectKey(): string {
        return this.projectKey;
    }

    public async uploadResults(
        results:
            | CypressCommandLine.CypressRunResult
            | CypressCommandLine.CypressFailedRunResult
    ): Promise<ImportExecutionResultsResponse> {
        if (results.status === "failed") {
            console.error(
                `Failed to run ${results.failures} tests:`,
                results.message
            );
        }
        const json = toXrayJSON(results as CypressCommandLine.CypressRunResult);
        const response = await this.upload(json);
        console.log("Successfully imported test execution results:", response);
        return response;
    }

    protected abstract upload(
        executionResults: XrayExecutionResults
    ): Promise<ImportExecutionResultsResponse>;
}
