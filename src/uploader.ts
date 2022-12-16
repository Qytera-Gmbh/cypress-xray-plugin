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
        results: CypressCommandLine.CypressRunResult
    ): Promise<ImportExecutionResultsResponse> {
        const json = toXrayJSON(results as CypressCommandLine.CypressRunResult);
        return await this.upload(json);
    }

    protected abstract upload(
        executionResults: XrayExecutionResults
    ): Promise<ImportExecutionResultsResponse>;
}
