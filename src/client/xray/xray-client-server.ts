import type { AxiosResponse } from "axios";
import FormData from "form-data";
import type { XrayTestExecutionResults } from "../../models/xray/import-test-execution-results";
import type { CucumberMultipartFeature } from "../../models/xray/requests/import-execution-cucumber-multipart";
import type { MultipartInfo } from "../../models/xray/requests/import-execution-multipart-info";
import type { GetTestRunResponseServer } from "../../models/xray/responses/graphql/get-test-runs";
import type { ImportExecutionResponseServer } from "../../models/xray/responses/import-execution";
import type {
    ImportFeatureResponse,
    ImportFeatureResponseServer,
    IssueDetails,
} from "../../models/xray/responses/import-feature";
import type { XrayLicenseStatus } from "../../models/xray/responses/license";
import { dedent } from "../../util/dedent";
import { LOG } from "../../util/logging";
import type { HttpCredentials } from "../authentication/credentials";
import type { AxiosRestClient } from "../https/requests";
import { loggedRequest } from "../util";
import { BaseXrayClient } from "./base-xray-client";

/**
 * Add evidence endpoint of Xray clients.
 */
export interface HasAddEvidenceEndpoint {
    /**
     * Add new evidence to a test run.
     *
     * @param testRunId - the ID of the test run
     * @param body - the evidence to add
     *
     * @see https://docs.getxray.app/display/XRAY/Test+Runs+-+REST#TestRunsREST-ExecutionEvidence
     */
    addEvidence(
        testRunId: number,
        body: {
            /**
             * The Content-Type representation header is used to indicate the original media type of the
             * resource.
             */
            contentType?: string;
            /**
             * The attachment data encoded in base64.
             */
            data: string;
            /**
             * The file name for the attachment.
             */
            filename: string;
        }
    ): Promise<void>;
}

/**
 * Get test run endpoint of Xray clients.
 */
export interface HasGetTestRunEndpoint {
    /**
     * Returns JSON that represents the test run.
     *
     * @param testRun - the ID of the test run to return or a query specifying the test run
     * @returns the test run results
     * @see https://docs.getxray.app/display/XRAY/Test+Runs+-+REST
     */
    getTestRun(
        testRun:
            | {
                  /**
                   * The key of the test execution.
                   */
                  testExecIssueKey: string;
                  /**
                   * The key of the test issue.
                   */
                  testIssueKey: string;
              }
            | number
    ): Promise<GetTestRunResponseServer>;
}

/**
 * Get Xray license endpoint of Xray clients.
 */
export interface HasGetXrayLicenseEndpoint {
    /**
     * Returns information about the Xray license, including its status and type.
     *
     * @returns the license status
     * @see https://docs.getxray.app/display/XRAY/v2.0#/External%20Apps/get_xraylicense
     */
    getXrayLicense(): Promise<XrayLicenseStatus>;
}

export class XrayClientServer
    extends BaseXrayClient<ImportFeatureResponseServer, ImportExecutionResponseServer>
    implements HasAddEvidenceEndpoint, HasGetTestRunEndpoint, HasGetXrayLicenseEndpoint
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

    @loggedRequest({ purpose: "add evidence" })
    public async addEvidence(
        ...[testRunId, evidence]: Parameters<HasAddEvidenceEndpoint["addEvidence"]>
    ): Promise<void> {
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        LOG.message("debug", "Adding test run evidence...");
        await this.httpClient.post(
            `${this.apiBaseUrl}/api/testrun/${testRunId.toString()}/attachment`,
            evidence,
            {
                headers: {
                    ...authorizationHeader,
                },
            }
        );
    }

    @loggedRequest({ purpose: "get test run" })
    public async getTestRun(
        ...[testRun]: Parameters<HasGetTestRunEndpoint["getTestRun"]>
    ): Promise<GetTestRunResponseServer> {
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        LOG.message("debug", "Getting test run results...");
        if (typeof testRun === "number") {
            const response: AxiosResponse<GetTestRunResponseServer> = await this.httpClient.get(
                `${this.apiBaseUrl}/api/testrun/${testRun.toString()}`,
                {
                    headers: {
                        ...authorizationHeader,
                    },
                }
            );
            return response.data;
        } else {
            const response: AxiosResponse<GetTestRunResponseServer> = await this.httpClient.get(
                `${this.apiBaseUrl}/api/testrun`,
                {
                    headers: {
                        ...authorizationHeader,
                    },
                    params: testRun,
                }
            );
            return response.data;
        }
    }

    @loggedRequest({ purpose: "get Xray license" })
    public async getXrayLicense(): Promise<XrayLicenseStatus> {
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        LOG.message("debug", "Getting Xray license status...");
        const licenseResponse: AxiosResponse<XrayLicenseStatus> = await this.httpClient.get(
            `${this.apiBaseUrl}/api/xraylicense`,
            {
                headers: {
                    ...authorizationHeader,
                },
            }
        );
        return licenseResponse.data;
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
                    MultipartInfo,
                ];
                const formData = new FormData();
                formData.append("result", JSON.stringify(cucumberJson), {
                    filename: "results.json",
                });
                formData.append("info", JSON.stringify(cucumberInfo), {
                    filename: "info.json",
                });
                return formData;
            }
            case "import-execution-multipart": {
                // Cast valid because of overload.
                const [executionResults, info] = args as [
                    XrayTestExecutionResults[],
                    MultipartInfo,
                ];
                const formData = new FormData();
                formData.append("result", JSON.stringify(executionResults), {
                    filename: "results.json",
                });
                formData.append("info", JSON.stringify(info), {
                    filename: "info.json",
                });
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
                        "debug",
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
                        "debug",
                        `Encountered an error during feature file import: ${serverResponse.message}`
                    );
                }
                if (serverResponse.testIssues && serverResponse.testIssues.length > 0) {
                    const testKeys = serverResponse.testIssues.map(
                        (test: IssueDetails) => test.key
                    );
                    response.updatedOrCreatedIssues.push(...testKeys);
                    LOG.message(
                        "debug",
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
                        "debug",
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
