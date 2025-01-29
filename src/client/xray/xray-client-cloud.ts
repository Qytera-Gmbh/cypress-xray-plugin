import type { AxiosResponse } from "axios";
import FormData from "form-data";
import type { StringMap } from "../../types/util";
import type { XrayTestExecutionResults } from "../../types/xray/import-test-execution-results";
import type { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import type { MultipartInfo } from "../../types/xray/requests/import-execution-multipart-info";
import type { GetTestExecutionResponseCloud } from "../../types/xray/responses/graphql/get-test-execution";
import type { GetTestRunsResponseCloud } from "../../types/xray/responses/graphql/get-test-runs";
import type { GetTestsResponse } from "../../types/xray/responses/graphql/get-tests";
import type { Test, TestRun } from "../../types/xray/responses/graphql/xray";
import type { ImportExecutionResponseCloud } from "../../types/xray/responses/import-execution";
import type {
    ImportFeatureResponse,
    ImportFeatureResponseCloud,
    IssueDetails,
} from "../../types/xray/responses/import-feature";
import { dedent } from "../../util/dedent";
import { LOG } from "../../util/logging";
import type { JwtCredentials } from "../authentication/credentials";
import type { AxiosRestClient } from "../https/requests";
import { loggedRequest } from "../util";
import { AbstractXrayClient } from "./xray-client";

interface HasTestTypes {
    /**
     * Returns Xray test types for the provided test issues, such as `Manual`, `Cucumber` or
     * `Generic`.
     *
     * @param projectKey - key of the project containing the test issues
     * @param issueKeys - the keys of the test issues to retrieve test types for
     * @returns a promise which will contain the mapping of issues to test types
     */
    getTestTypes(projectKey: string, ...issueKeys: string[]): Promise<StringMap<string>>;
}

interface HasTestResults {
    /**
     * Returns a test execution by issue ID.
     *
     * @param issueId - the id of the test execution issue to be returned
     * @returns the tests contained in the test execution
     * @see https://us.xray.cloud.getxray.app/doc/graphql/gettestexecution.doc.html
     */
    getTestResults(issueId: string): Promise<Test<{ key: string; summary: string }>[]>;
}

interface HasTestRunResults {
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

export class XrayClientCloud
    extends AbstractXrayClient<ImportFeatureResponseCloud, ImportExecutionResponseCloud>
    implements HasTestTypes, HasTestResults, HasTestRunResults
{
    /**
     * The URLs of Xray's Cloud API.
     * Note: API v1 would also work, but let's stick to the more recent one.
     */
    public static readonly URL = "https://xray.cloud.getxray.app/api/v2";
    private static readonly URL_GRAPHQL = `${XrayClientCloud.URL}/graphql`;
    private static readonly GRAPHQL_LIMIT = 100;

    /**
     * Construct a new Xray cloud client using the provided credentials.
     *
     * @param credentials - the credentials to use during authentication
     * @param httpClient - the HTTP client to use for dispatching requests
     */
    constructor(credentials: JwtCredentials, httpClient: AxiosRestClient) {
        super(XrayClientCloud.URL, credentials, httpClient);
    }

    @loggedRequest({ purpose: "get test results" })
    public async getTestResults(issueId: string): ReturnType<HasTestResults["getTestResults"]> {
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        LOG.message("debug", "Retrieving test results...");
        const tests: Test<{ key: string; summary: string }>[] = [];
        let total = 0;
        let start = 0;
        const query = dedent(`
            query($issueId: String, $start: Int!, $limit: Int!) {
                getTestExecution(issueId: $issueId) {
                    tests(start: $start, limit: $limit) {
                        total
                        start
                        limit
                        results {
                            issueId
                            status {
                                name
                            }
                            jira(fields: ["key", "summary"])
                        }
                    }
                }
            }
        `);
        do {
            const paginatedRequest = {
                query: query,
                variables: {
                    issueId: issueId,
                    limit: XrayClientCloud.GRAPHQL_LIMIT,
                    start: start,
                },
            };
            const response: AxiosResponse<
                GetTestExecutionResponseCloud<{ key: string; summary: string }>
            > = await this.httpClient.post(XrayClientCloud.URL_GRAPHQL, paginatedRequest, {
                headers: {
                    ...authorizationHeader,
                },
            });
            const data = response.data.data.getTestExecution;
            total = data.tests?.total ?? total;
            if (data.tests?.results) {
                if (typeof data.tests.start === "number") {
                    start = data.tests.start + data.tests.results.length;
                }
                for (const test of data.tests.results) {
                    if (test.status?.name) {
                        tests.push(test);
                    }
                }
            }
        } while (start && start < total);
        LOG.message(
            "debug",
            `Successfully retrieved test results for test execution issue: ${issueId}`
        );
        return tests;
    }

    @loggedRequest({ purpose: "get test run results" })
    public async getTestRunResults(
        options: Parameters<HasTestRunResults["getTestRunResults"]>[0]
    ): Promise<TestRun<{ key: string }>[]> {
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
                await this.httpClient.post(XrayClientCloud.URL_GRAPHQL, paginatedRequest, {
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

    @loggedRequest({ purpose: "get test types" })
    public async getTestTypes(
        projectKey: string,
        ...issueKeys: string[]
    ): ReturnType<HasTestTypes["getTestTypes"]> {
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        LOG.message("debug", "Retrieving test types...");
        const types: StringMap<string> = {};
        let total = 0;
        let start = 0;
        const query = dedent(`
            query($jql: String, $start: Int!, $limit: Int!) {
                getTests(jql: $jql, start: $start, limit: $limit) {
                    total
                    start
                    results {
                        testType {
                            name
                            kind
                        }
                        jira(fields: ["key"])
                    }
                }
            }
        `);
        do {
            const paginatedRequest = {
                query: query,
                variables: {
                    jql: `project = '${projectKey}' AND issue in (${issueKeys.join(",")})`,
                    limit: XrayClientCloud.GRAPHQL_LIMIT,
                    start: start,
                },
            };
            const response: AxiosResponse<GetTestsResponse<{ key: string }>> =
                await this.httpClient.post(XrayClientCloud.URL_GRAPHQL, paginatedRequest, {
                    headers: {
                        ...authorizationHeader,
                    },
                });
            total = response.data.data.getTests.total ?? total;
            if (response.data.data.getTests.results) {
                if (typeof response.data.data.getTests.start === "number") {
                    start =
                        response.data.data.getTests.start +
                        response.data.data.getTests.results.length;
                }
                for (const test of response.data.data.getTests.results) {
                    if (test.jira.key && test.testType?.name) {
                        types[test.jira.key] = test.testType.name;
                    }
                }
            }
        } while (start && start < total);
        LOG.message(
            "debug",
            `Successfully retrieved test types for ${issueKeys.length.toString()} issues.`
        );
        return types;
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
                const resultString = JSON.stringify(cucumberJson);
                const infoString = JSON.stringify(cucumberInfo);
                const formData = new FormData();
                formData.append("results", resultString, {
                    filename: "results.json",
                });
                formData.append("info", infoString, {
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
                const resultString = JSON.stringify(executionResults);
                const infoString = JSON.stringify(info);
                const formData = new FormData();
                formData.append("results", resultString, {
                    filename: "results.json",
                });
                formData.append("info", infoString, {
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
