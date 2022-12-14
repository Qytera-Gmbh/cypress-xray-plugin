import { toXrayJSON } from "./conversion/conversion";
import { APICredentials, APICredentialsOptions } from "./credentials";
import { ImportExecutionResultsResponse } from "./types/xray/responses";
import { XrayExecutionResults } from "./types/xray/xray";

export abstract class Uploader<
    T extends APICredentials<APICredentialsOptions>
> {
    protected readonly credentials: T;

    constructor(credentials: T) {
        this.credentials = credentials;
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
        throw new Error("no");
        return await this.upload(json);
    }

    protected abstract upload(
        executionResults: XrayExecutionResults
    ): Promise<ImportExecutionResultsResponse>;
}
