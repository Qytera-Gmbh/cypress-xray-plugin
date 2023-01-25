import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import {
    BasicAuthCredentials,
    HTTPHeader,
    PATCredentials,
} from "../credentials";
import { Requests } from "../https/requests";
import { info, log, success } from "../logging/logging";
import {
    ExportCucumberTestsResponse,
    ImportCucumberTestsResponse,
    ImportIssueResponse,
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
    ): Promise<ImportIssueResponse> {
        return this.credentials
            .getAuthenticationHeader()
            .then(async (header: HTTPHeader) => {
                log(`Uploading test results to ${this.apiBaseURL} ...`);
                const progressInterval = setInterval(() => {
                    info("Still uploading...");
                }, 5000);
                try {
                    const response = await Requests.post(
                        `${this.apiBaseURL}/rest/raven/latest/api/import/execution`,
                        executionResults,
                        {
                            headers: {
                                ...header,
                            },
                        }
                    );
                    success(
                        "Successfully uploaded test execution results:",
                        JSON.stringify(response.data)
                    );
                    return response.data;
                } catch (error: unknown) {
                    throw new Error(
                        `Failed to upload results to Xray: "${error}"`
                    );
                } finally {
                    clearInterval(progressInterval);
                }
            });
    }

    protected doExportCucumberTests(
        keys?: string,
        filter?: number
    ): Promise<ExportCucumberTestsResponse> {
        throw new Error("Method not implemented.");
    }

    protected async doImportCucumberTests(
        file: string,
        projectKey?: string
    ): Promise<ImportCucumberTestsResponse> {
        const header = await this.credentials.getAuthenticationHeader();
        log("Importing cucumber feature files...");
        const progressInterval = setInterval(() => {
            info("Still importing...");
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
                    success(
                        "Successfully updated or created test issues:",
                        JSON.stringify(response.data.testIssues)
                    );
                }
                if (response.data.preConditionIssues.length > 0) {
                    success(
                        "Successfully updated or created precondition issues:",
                        JSON.stringify(response.data.preConditionIssues)
                    );
                }
            } else {
                success(
                    "Successfully updated or created issues:",
                    JSON.stringify(response.data)
                );
            }
            return response.data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `Failed to import cucumber feature files into Xray: "${error.response.data.error}"`
                );
            }
            throw new Error(
                `Failed to import cucumber feature files into Xray: "${error}"`
            );
        } finally {
            clearInterval(progressInterval);
        }
    }
}
