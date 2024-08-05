import { AxiosResponse } from "axios";
import { XrayTestExecutionResults } from "../../types/xray/import-test-execution-results";
import { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import { MultipartInfo } from "../../types/xray/requests/import-execution-multipart-info";
import { GetTestExecutionResponseServer } from "../../types/xray/responses/graphql/get-test-execution";
import { ImportExecutionResponseServer } from "../../types/xray/responses/import-execution";
import {
    ImportFeatureResponse,
    ImportFeatureResponseServer,
    IssueDetails,
} from "../../types/xray/responses/import-feature";
import { XrayLicenseStatus } from "../../types/xray/responses/license";
import { dedent } from "../../util/dedent";
import { LoggedError, errorMessage } from "../../util/errors";
import { LOG, Level } from "../../util/logging";
import { HttpCredentials } from "../authentication/credentials";
import { AxiosRestClient } from "../https/requests";
import { AbstractXrayClient, XrayClient } from "./xray-client";

export interface XrayClientServer extends XrayClient {
    /**
     * Return a list of the tests associated with the test execution.
     *
     * @param testExecutionIssueKey - the test execution issue key
     * @returns the tests
     */
    getTestExecution(
        testExecutionIssueKey: string,
        query?: {
            /**
             * Whether detailed information about the test run should be returned.
             */
            detailed?: boolean;
            /**
             * Limits the number of results per page. Should be greater or equal to 0 and lower or
             * equal to the maximum set in Xray's global configuration.
             */
            limit?: number;
            /**
             * Number of the page to be retuned. Should be greater or equal to 1.
             */
            page?: number;
        }
    ): Promise<GetTestExecutionResponseServer>;
    /**
     * Returns information about the Xray license, including its status and type.
     *
     * @returns the license status
     * @see https://docs.getxray.app/display/XRAY/v2.0#/External%20Apps/get_xraylicense
     */
    getXrayLicense(): Promise<XrayLicenseStatus>;
}

export class ServerClient
    extends AbstractXrayClient<ImportFeatureResponseServer, ImportExecutionResponseServer>
    implements XrayClientServer
{
    /**
     * Construct a new client using the provided credentials.
     *
     * @param apiBaseUrl - the base URL for all HTTP requests
     * @param credentials - the credentials to use during authentication
     * @param httpClient - the HTTP client to use for dispatching requests
     */
    constructor(apiBaseUrl: string, credentials: HttpCredentials, httpClient: AxiosRestClient) {
        super(`${apiBaseUrl}/rest/raven/latest`, credentials, httpClient);
    }

    public async getTestExecution(
        testExecutionIssueKey: string,
        query?: Parameters<XrayClientServer["getTestExecution"]>[1]
    ): Promise<GetTestExecutionResponseServer> {
        try {
            const authorizationHeader = await this.credentials.getAuthorizationHeader();
            LOG.message(Level.DEBUG, "Getting test execution results...");
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            let currentPage = query?.page ?? 1;
            let pagedTests: GetTestExecutionResponseServer = [];
            const allTests: GetTestExecutionResponseServer = [];
            do {
                try {
                    const testsResponse: AxiosResponse<GetTestExecutionResponseServer> =
                        await this.httpClient.get(
                            `${this.apiBaseUrl}/api/testexec/${testExecutionIssueKey}/test`,
                            {
                                headers: {
                                    ...authorizationHeader,
                                },
                                params: {
                                    detailed: query?.detailed,
                                    limit: query?.limit,
                                    page: currentPage,
                                },
                            }
                        );
                    allTests.push(...testsResponse.data);
                    pagedTests = testsResponse.data;
                    currentPage++;
                } finally {
                    clearInterval(progressInterval);
                }
            } while (pagedTests.length > 0);
            return allTests;
        } catch (error: unknown) {
            LOG.message(
                Level.ERROR,
                `Failed to retrieve test execution information: ${errorMessage(error)}`
            );
            LOG.logErrorToFile(error, "getTestExecutionError");
            throw new LoggedError("Failed to get test execution information");
        }
    }

    public async getXrayLicense(): Promise<XrayLicenseStatus> {
        try {
            const authorizationHeader = await this.credentials.getAuthorizationHeader();
            LOG.message(Level.DEBUG, "Getting Xray license status...");
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
                const licenseResponse: AxiosResponse<XrayLicenseStatus> = await this.httpClient.get(
                    `${this.apiBaseUrl}/api/xraylicense`,
                    {
                        headers: {
                            ...authorizationHeader,
                        },
                    }
                );
                return licenseResponse.data;
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            LOG.message(
                Level.ERROR,
                `Failed to retrieve license information: ${errorMessage(error)}`
            );
            LOG.logErrorToFile(error, "getXrayLicenseError");
            throw new LoggedError("Failed to get Xray license");
        }
    }

    protected onRequest(
        event: "import-execution-cucumber-multipart",
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: MultipartInfo
    ): FormData;
    protected onRequest(
        event: "import-execution-multipart",
        executionResults: XrayTestExecutionResults,
        info: MultipartInfo
    ): FormData;
    protected onRequest(
        event: "import-execution-cucumber-multipart" | "import-execution-multipart",
        ...args: unknown[]
    ) {
        switch (event) {
            case "import-execution-cucumber-multipart": {
                // Cast valid because of overload.
                const [cucumberJson, cucumberInfo] = args as [
                    CucumberMultipartFeature[],
                    MultipartInfo
                ];
                const resultString = JSON.stringify(cucumberJson);
                const infoString = JSON.stringify(cucumberInfo);
                const formData = new FormData();
                formData.append("info", new Blob([infoString]));
                formData.append("result", new Blob([resultString]));
                return formData;
            }
            case "import-execution-multipart": {
                // Cast valid because of overload.
                const [executionResults, info] = args as [
                    XrayTestExecutionResults[],
                    MultipartInfo
                ];
                const resultString = JSON.stringify(executionResults);
                const infoString = JSON.stringify(info);
                const formData = new FormData();
                formData.append("info", new Blob([infoString]));
                formData.append("result", new Blob([resultString]));
                return formData;
            }
        }
    }

    protected onResponse(
        event: "import-feature",
        response: ImportFeatureResponseServer
    ): ImportFeatureResponse;
    protected onResponse(
        event:
            | "import-execution-cucumber-multipart"
            | "import-execution-multipart"
            | "import-execution",
        response: ImportExecutionResponseServer
    ): string;
    protected onResponse(
        event:
            | "import-execution-cucumber-multipart"
            | "import-execution-multipart"
            | "import-execution"
            | "import-feature",
        ...args: unknown[]
    ) {
        switch (event) {
            case "import-feature": {
                // Cast valid because of overload.
                const [serverResponse] = args as [ImportFeatureResponseServer];
                const response: ImportFeatureResponse = {
                    errors: [],
                    updatedOrCreatedIssues: [],
                };
                if (Array.isArray(serverResponse)) {
                    const issueKeys = serverResponse.map((test: IssueDetails) => test.key);
                    response.updatedOrCreatedIssues.push(...issueKeys);
                    LOG.message(
                        Level.DEBUG,
                        dedent(`
                            Successfully updated or created issues:

                              ${issueKeys.join(", ")}
                        `)
                    );
                    return response;
                }
                // Occurs when scenarios cause errors in Xray, e.g. typos in keywords ('Scenariot').
                if (serverResponse.message) {
                    response.errors.push(serverResponse.message);
                    LOG.message(
                        Level.DEBUG,
                        `Encountered an error during feature file import: ${serverResponse.message}`
                    );
                }
                if (serverResponse.testIssues && serverResponse.testIssues.length > 0) {
                    const testKeys = serverResponse.testIssues.map(
                        (test: IssueDetails) => test.key
                    );
                    response.updatedOrCreatedIssues.push(...testKeys);
                    LOG.message(
                        Level.DEBUG,
                        dedent(`
                            Successfully updated or created test issues:

                              ${testKeys.join(", ")}
                        `)
                    );
                }
                if (
                    serverResponse.preconditionIssues &&
                    serverResponse.preconditionIssues.length > 0
                ) {
                    const preconditionKeys = serverResponse.preconditionIssues.map(
                        (test: IssueDetails) => test.key
                    );
                    response.updatedOrCreatedIssues.push(...preconditionKeys);
                    LOG.message(
                        Level.DEBUG,
                        dedent(`
                            Successfully updated or created precondition issues:

                              ${preconditionKeys.join(", ")}
                        `)
                    );
                }
                return response;
            }
            case "import-execution-cucumber-multipart":
            case "import-execution-multipart":
            case "import-execution": {
                // Cast valid because of overload.
                const [serverResponse] = args as [ImportExecutionResponseServer];
                return serverResponse.testExecIssue.key;
            }
        }
    }
}
