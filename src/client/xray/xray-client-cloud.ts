import { AxiosResponse } from "axios";
import FormData from "form-data";
import { StringMap } from "../../types/util";
import { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import { CucumberMultipartInfo } from "../../types/xray/requests/import-execution-cucumber-multipart-info";
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
import { AxiosRestClient, RequestConfigPost } from "../https/requests";
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

export class XrayClientCloud extends AbstractXrayClient implements HasTestTypes, HasTestResults {
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
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
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
            } finally {
                clearInterval(progressInterval);
            }
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
            const progressInterval = this.startResponseInterval(this.apiBaseUrl);
            try {
                const types: StringMap<string> = {};
                let total = 0;
                let start = 0;
                const jql = `project = '${projectKey}' AND issue in (${issueKeys.join(",")})`;
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
                            jql: jql,
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
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            LOG.message(Level.ERROR, `Failed to get test types: ${errorMessage(error)}`);
            LOG.logErrorToFile(error, "getTestTypes");
            throw new LoggedError("Failed to get test types");
        }
    }

    protected getUrlImportExecution(): string {
        return `${this.apiBaseUrl}/import/execution`;
    }

    protected getUrlImportFeature(
        projectKey?: string,
        projectId?: string,
        source?: string
    ): string {
        const query: string[] = [];
        if (projectKey) {
            query.push(`projectKey=${projectKey}`);
        }
        if (projectId) {
            query.push(`projectId=${projectId}`);
        }
        if (source) {
            query.push(`source=${source}`);
        }
        return `${this.apiBaseUrl}/import/feature?${query.join("&")}`;
    }

    protected handleResponseImportExecution(response: ImportExecutionResponseCloud): string {
        return response.key;
    }

    protected handleResponseImportFeature(
        cloudResponse: ImportFeatureResponseCloud
    ): ImportFeatureResponse {
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

    protected async prepareRequestImportExecutionCucumberMultipart(
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: CucumberMultipartInfo
    ): Promise<RequestConfigPost<FormData>> {
        const formData = new FormData();
        const resultString = JSON.stringify(cucumberJson);
        const infoString = JSON.stringify(cucumberInfo);
        formData.append("results", resultString, {
            filename: "results.json",
        });
        formData.append("info", infoString, {
            filename: "info.json",
        });
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        return {
            config: {
                headers: {
                    ...authorizationHeader,
                    ...formData.getHeaders(),
                },
            },
            data: formData,
            url: `${this.apiBaseUrl}/import/execution/cucumber/multipart`,
        };
    }

    protected handleResponseImportExecutionCucumberMultipart(
        response: ImportExecutionResponseCloud
    ): string {
        return response.key;
    }
}
