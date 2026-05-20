import type { AxiosResponse } from "axios";
import FormData from "form-data";
import type {
    XrayEvidenceItem,
    XrayTestExecutionResults,
} from "../../models/xray/import-test-execution-results";
import type { CucumberMultipartFeature } from "../../models/xray/requests/import-execution-cucumber-multipart";
import type { MultipartInfo } from "../../models/xray/requests/import-execution-multipart-info";
import type { GetTestRunsResponseCloud } from "../../models/xray/responses/graphql/get-test-runs";
import type { TestRun } from "../../models/xray/responses/graphql/xray";
import type { ImportExecutionResponseCloud } from "../../models/xray/responses/import-execution";
import type {
    ImportFeatureResponse,
    ImportFeatureResponseCloud,
    IssueDetails,
} from "../../models/xray/responses/import-feature";
import { dedent } from "../../util/dedent";
import { LOG } from "../../util/logging";
import type { JwtCredentials } from "../authentication/credentials";
import type { AxiosRestClient } from "../https/requests";
import { loggedRequest } from "../util";
import { BaseXrayClient } from "./base-xray-client";

/**
 * Get test run results endpoint of Xray clients.
 */
export interface HasGetTestRunResultsEndpoint {
    /**
     * Returns a test execution by issue ID.
     *
     * @param options - the GraphQL options
     * @returns the test run results
     * @see https://us.xray.cloud.getxray.app/doc/graphql/gettestruns.doc.html
     */
    getTestRunResults(options: {
        /**
         * The issue ids of the test execution of the test runs.
         */
        testExecIssueIds: [string, ...string[]];
        /**
         * The issue ids of the test of the test runs.
         */
        testIssueIds: [string, ...string[]];
    }): Promise<TestRun<{ key: string }>[]>;
}

/**
 * Add evidence to test run endpoint of Xray clients.
 */
export interface HasAddEvidenceToTestRunEndpoint {
    /**
     * Mutation used to add evidence to a test run.
     *
     * @param variables - the GraphQL variable values
     * @returns the result
     *
     * @see https://us.xray.cloud.getxray.app/doc/graphql/addevidencetotestrun.doc.html
     */
    addEvidenceToTestRun: (variables: {
        /**
         * The evidence to add to the test run.
         */
        evidence: readonly XrayEvidenceItem[];
        /**
         * The ID of the test run.
         */
        id: string;
    }) => Promise<{
        /**
         * IDs of the added evidence.
         */
        addedEvidence: string[];
        /**
         * Warnings generated during the operation.
         */
        warnings: string[];
    }>;
}

export class XrayClientCloud
    extends BaseXrayClient<ImportFeatureResponseCloud, ImportExecutionResponseCloud>
    implements HasAddEvidenceToTestRunEndpoint, HasGetTestRunResultsEndpoint
{
    /**
     * The version of Xray's Cloud API. API v1 would also work, but let's stick to the recent one.
     */
    public static readonly VERSION = "v2";
    private static readonly GRAPHQL_LIMIT = 100;

    /**
     * Construct a new Xray cloud client using the provided credentials.
     *
     * @param url - the base URL
     * @param credentials - the credentials to use during authentication
     * @param httpClient - the HTTP client to use for dispatching requests
     */
    constructor(url: string, credentials: JwtCredentials, httpClient: AxiosRestClient) {
        super(`${url}/api/${XrayClientCloud.VERSION}`, credentials, httpClient);
    }

    @loggedRequest({ purpose: "add evidence to test run" })
    public async addEvidenceToTestRun(
        ...[variables]: Parameters<HasAddEvidenceToTestRunEndpoint["addEvidenceToTestRun"]>
    ): ReturnType<HasAddEvidenceToTestRunEndpoint["addEvidenceToTestRun"]> {
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        const mutation = dedent(`
            mutation($id: String!, $evidence: [AttachmentDataInput]!) {
                addEvidenceToTestRun(id: $id, evidence: $evidence) {
                    addedEvidence
                    warnings
                }
            }
       `);
        const response: AxiosResponse<{
            data: { addEvidenceToTestRun: { addedEvidence: string[]; warnings: string[] } };
        }> = await this.httpClient.post(
            `${this.apiBaseUrl}/graphql`,
            {
                query: mutation,
                variables: {
                    evidence: variables.evidence.map((evidence) => {
                        return {
                            data: evidence.data,
                            filename: evidence.filename,
                            mimeType: evidence.contentType,
                        };
                    }),
                    id: variables.id,
                },
            },
            { headers: { ...authorizationHeader } }
        );
        for (const evidence of variables.evidence) {
            LOG.message(
                "debug",
                `Successfully added evidence ${evidence.filename} to test run ${variables.id}.`
            );
        }
        return response.data.data.addEvidenceToTestRun;
    }

    @loggedRequest({ purpose: "get test run results" })
    public async getTestRunResults(
        ...[options]: Parameters<HasGetTestRunResultsEndpoint["getTestRunResults"]>
    ): ReturnType<HasGetTestRunResultsEndpoint["getTestRunResults"]> {
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        LOG.message("debug", "Retrieving test run results...");
        const runResults: TestRun<{ key: string }>[] = [];
        let total = 0;
        let start = 0;
        const query = dedent(`
            query($testIssueIds: [String], $testExecIssueIds: [String], $start: Int!, $limit: Int!) {
                getTestRuns( testIssueIds: $testIssueIds, testExecIssueIds: $testExecIssueIds, limit: $limit, start: $start) {
                    total
                    limit
                    start
                    results {
                        id
                        status {
                            name
                        }
                        test {
                            jira(fields: ["key"])
                        }
                        evidence {
                            filename
                            downloadLink
                        }
                        iterations(limit: $limit) {
                            results {
                                parameters {
                                    name
                                    value
                                }
                                status {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `);
        do {
            const paginatedRequest = {
                query: query,
                variables: {
                    limit: XrayClientCloud.GRAPHQL_LIMIT,
                    start: start,
                    testExecIssueIds: options.testExecIssueIds,
                    testIssueIds: options.testIssueIds,
                },
            };
            const response: AxiosResponse<GetTestRunsResponseCloud<{ key: string }>> =
                await this.httpClient.post(`${this.apiBaseUrl}/graphql`, paginatedRequest, {
                    headers: {
                        ...authorizationHeader,
                    },
                });
            const data = response.data.data.getTestRuns;
            total = data?.total ?? total;
            if (data?.results) {
                if (typeof data.start === "number") {
                    start = data.start + data.results.length;
                }
                for (const test of data.results) {
                    runResults.push(test);
                }
            }
        } while (start && start < total);
        LOG.message("debug", "Successfully retrieved test run results");
        return runResults;
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
                formData.append("results", JSON.stringify(cucumberJson), {
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
                formData.append("results", JSON.stringify(executionResults), {
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
        response: ImportFeatureResponseCloud
    ): ImportFeatureResponse;
    protected onResponse(
        event:
            | "import-execution-cucumber-multipart"
            | "import-execution-multipart"
            | "import-execution",
        response: ImportExecutionResponseCloud
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
                const [cloudResponse] = args as [ImportFeatureResponseCloud];
                const response: ImportFeatureResponse = {
                    errors: [],
                    updatedOrCreatedIssues: [],
                };
                if (cloudResponse.errors.length > 0) {
                    response.errors.push(...cloudResponse.errors);
                    LOG.message(
                        "debug",
                        dedent(`
                            Encountered some errors during feature file import:
                            ${cloudResponse.errors.map((error: string) => `- ${error}`).join("\n")}
                        `)
                    );
                }
                if (cloudResponse.updatedOrCreatedTests.length > 0) {
                    const testKeys = cloudResponse.updatedOrCreatedTests.map(
                        (test: IssueDetails) => test.key
                    );
                    response.updatedOrCreatedIssues.push(...testKeys);
                    LOG.message(
                        "debug",
                        dedent(`
                            Successfully updated or created test issues:

                              ${testKeys.join("\n")}
                        `)
                    );
                }
                if (cloudResponse.updatedOrCreatedPreconditions.length > 0) {
                    const preconditionKeys = cloudResponse.updatedOrCreatedPreconditions.map(
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
                const [cloudResponse] = args as [ImportExecutionResponseCloud];
                return cloudResponse.key;
            }
        }
    }
}
