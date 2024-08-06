import { AxiosResponse } from "axios";
import FormData from "form-data";
import { StringMap } from "../../types/util";
import { XrayTestExecutionResults } from "../../types/xray/import-test-execution-results";
import { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import { MultipartInfo } from "../../types/xray/requests/import-execution-multipart-info";
import { GetTestExecutionResponseCloud } from "../../types/xray/responses/graphql/get-test-execution";
import { GetTestsResponse } from "../../types/xray/responses/graphql/get-tests";
import { Test } from "../../types/xray/responses/graphql/xray";
import { ImportExecutionResponseCloud } from "../../types/xray/responses/import-execution";
import {
    ImportFeatureResponse,
    ImportFeatureResponseCloud,
    IssueDetails,
} from "../../types/xray/responses/import-feature";
import { dedent } from "../../util/dedent";
import { LoggedError, errorMessage } from "../../util/errors";
import { LOG, Level } from "../../util/logging";
import { JwtCredentials } from "../authentication/credentials";
import { AxiosRestClient } from "../https/requests";
import { AbstractXrayClient } from "./xray-client";

export interface HasTestTypes {
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

export interface HasTestResults {
    /**
     * Returns a test execution by issue ID.
     *
     * @param issueId - the id of the test execution issue to be returned
     * @returns the tests contained in the test execution
     * @see https://us.xray.cloud.getxray.app/doc/graphql/gettestexecution.doc.html
     */
    getTestResults(issueId: string): Promise<Test<{ key: string; summary: string }>[]>;
}

export class XrayClientCloud
    extends AbstractXrayClient<ImportFeatureResponseCloud, ImportExecutionResponseCloud>
    implements HasTestTypes, HasTestResults
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

    public async getTestResults(issueId: string): ReturnType<HasTestResults["getTestResults"]> {
        try {
            const authorizationHeader = await this.credentials.getAuthorizationHeader();
            LOG.message(Level.DEBUG, "Retrieving test results...");
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
                Level.DEBUG,
                `Successfully retrieved test results for test execution issue: ${issueId}`
            );
            return tests;
        } catch (error: unknown) {
            LOG.message(Level.ERROR, `Failed to get test results: ${errorMessage(error)}`);
            LOG.logErrorToFile(error, "getTestResultsError");
            throw new LoggedError("Failed to get test results");
        }
    }

    /**
     * Returns Xray test types for the provided test issues, such as `Manual`, `Cucumber` or
     * `Generic`.
     *
     * @param projectKey - key of the project containing the test issues
     * @param issueKeys - the keys of the test issues to retrieve test types for
     * @returns a promise which will contain the mapping of issues to test types
     */
    public async getTestTypes(
        projectKey: string,
        ...issueKeys: string[]
    ): ReturnType<HasTestTypes["getTestTypes"]> {
        try {
            const authorizationHeader = await this.credentials.getAuthorizationHeader();
            LOG.message(Level.DEBUG, "Retrieving test types...");
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
                Level.DEBUG,
                `Successfully retrieved test types for ${issueKeys.length.toString()} issues.`
            );
            return types;
        } catch (error: unknown) {
            LOG.message(Level.ERROR, `Failed to get test types: ${errorMessage(error)}`);
            LOG.logErrorToFile(error, "getTestTypes");
            throw new LoggedError("Failed to get test types");
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
                    MultipartInfo
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
                        Level.DEBUG,
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
                        Level.DEBUG,
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
                const [cloudResponse] = args as [ImportExecutionResponseCloud];
                return cloudResponse.key;
            }
        }
    }
}
