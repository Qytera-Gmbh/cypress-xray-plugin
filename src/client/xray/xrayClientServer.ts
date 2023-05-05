import FormData from "form-data";
import fs from "fs";
import {
    BasicAuthCredentials,
    HTTPHeader,
    PATCredentials,
} from "../../authentication/credentials";
import { ImportExecutionResultsConverterServer } from "../../conversion/importExecutionResults/importExecutionResultsConverterServer";
import { Requests } from "../../https/requests";
import { logInfo, logSuccess } from "../../logging/logging";
import { XrayTestExecutionResultsServer } from "../../types/xray/importTestExecutionResults";
import {
    ExportCucumberTestsResponse,
    ImportCucumberTestsResponse,
    ImportIssueResponse,
} from "../../types/xray/responses";
import { XrayClient } from "./xrayClient";

export class XrayClientServer extends XrayClient<
    BasicAuthCredentials | PATCredentials
> {
    private readonly apiBaseURL: string;

    /**
     * Construct a new Xray Server client.
     *
     * @param apiBaseURL the Xray server base endpoint
     * @param credentials the credentials to use during authentication
     */
    constructor(
        apiBaseURL: string,
        credentials: BasicAuthCredentials | PATCredentials
    ) {
        super(credentials);
        this.apiBaseURL = apiBaseURL;
    }

    public async dispatchImportTestExecutionResultsRequest(
        results: CypressCommandLine.CypressRunResult
    ): Promise<ImportIssueResponse> {
        const json: XrayTestExecutionResultsServer =
            new ImportExecutionResultsConverterServer().convertExecutionResults(
                results
            );
        return this.credentials
            .getAuthenticationHeader()
            .then(async (header: HTTPHeader) => {
                logInfo(`Uploading test results to ${this.apiBaseURL} ...`);
                const progressInterval = setInterval(() => {
                    logInfo("Still uploading...");
                }, 5000);
                try {
                    const response = await Requests.post(
                        `${this.apiBaseURL}/rest/raven/latest/api/import/execution`,
                        json,
                        {
                            headers: {
                                ...header,
                            },
                        }
                    );
                    logSuccess(
                        "Successfully uploaded test execution results:",
                        JSON.stringify(response.data)
                    );
                    return response.data;
                } finally {
                    clearInterval(progressInterval);
                }
            });
    }

    public dispatchExportCucumberTestsRequest(
        keys?: string,
        filter?: number
    ): Promise<ExportCucumberTestsResponse> {
        throw new Error("Method not implemented.");
    }

    public async dispatchImportCucumberTestsRequest(
        file: string,
        projectKey?: string
    ): Promise<ImportCucumberTestsResponse> {
        const header = await this.credentials.getAuthenticationHeader();
        logInfo("Importing cucumber feature files...");
        const progressInterval = setInterval(() => {
            logInfo("Still importing...");
        }, 5000);
        try {
            const fileContent = fs.createReadStream(file);
            const form = new FormData();
            form.append("file", fileContent);

            const response = await Requests.post<FormData>(
                `${this.apiBaseURL}/rest/raven/latest/import/feature?projectKey=${projectKey}`,
                form,
                {
                    headers: {
                        ...header,
                        ...form.getHeaders(),
                    },
                }
            );
            // Happens when scenarios cause errors in Xray.
            // E.g. typos in Gherkin keywords ('Scenariot').
            if ("message" in response.data) {
                if (response.data.testIssues.length > 0) {
                    logSuccess(
                        "Successfully updated or created test issues:",
                        JSON.stringify(response.data.testIssues)
                    );
                }
                if (response.data.preConditionIssues.length > 0) {
                    logSuccess(
                        "Successfully updated or created precondition issues:",
                        JSON.stringify(response.data.preConditionIssues)
                    );
                }
            } else {
                logSuccess(
                    "Successfully updated or created issues:",
                    JSON.stringify(response.data)
                );
            }
            return response.data;
        } finally {
            clearInterval(progressInterval);
        }
    }
}
