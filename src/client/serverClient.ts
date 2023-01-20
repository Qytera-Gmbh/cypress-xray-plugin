import axios, { AxiosResponse } from "axios";
import FormData from "form-data";
import fs from "fs";
import {
    BasicAuthCredentials,
    HTTPHeader,
    PATCredentials,
} from "../credentials";
import { Requests } from "../https/requests";
import {
    ExportCucumberTestsResponse,
    ImportCucumberTestsResponse,
    ImportIssueResponse,
    ServerImportCucumberTestsResponse,
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
    ): Promise<ExportCucumberTestsResponse> {
        throw new Error("Method not implemented.");
    }

    protected doImportCucumberTests(
        file: string,
        projectKey?: string
    ): Promise<ImportCucumberTestsResponse> {
        return this.credentials
            .getAuthenticationHeader()
            .then(async (header: HTTPHeader) => {
                console.log("Importing cucumber feature files...");
                const progressInterval = setInterval(() => {
                    console.log("\tStill importing...");
                }, 5000);
                try {
                    const fileContent = fs.createReadStream(file);
                    const form = new FormData();
                    form.append("file", fileContent);

                    const response = await axios.post<
                        FormData,
                        AxiosResponse<
                            | ServerImportCucumberTestsResponse
                            | ImportIssueResponse[]
                        >
                    >(`${this.apiBaseURL}/import/feature`, form, {
                        headers: {
                            ...header,
                            ...form.getHeaders(),
                        },
                        params: {
                            projectKey: projectKey,
                        },
                    });
                    // Happens when scenarios cause errors in Xray.
                    // E.g. typos in Gherkin keywords ('Scenariot').
                    if ("message" in response.data) {
                        console.error(response.data.message);
                        if (response.data.testIssues.length > 0) {
                            console.log(
                                "Successfully updated or created test issues:",
                                response.data.testIssues
                            );
                        }
                        if (response.data.preConditionIssues.length > 0) {
                            console.log(
                                "Successfully updated or created precondition issues:",
                                response.data.preConditionIssues
                            );
                        }
                    } else {
                        console.log(
                            "Successfully updated or created issues:",
                            response.data
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
            });
    }
}
