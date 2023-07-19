import dedent from "dedent";
import { JWTCredentials } from "../../authentication/credentials";
import { Requests } from "../../https/requests";
import { logError, logInfo, logSuccess, logWarning, writeErrorFile } from "../../logging/logging";
import { GetTestsResponse } from "../../types/xray/responses/graphql/getTests";
import { ImportExecutionResponseCloud } from "../../types/xray/responses/importExecution";
import { ImportFeatureResponseCloud, IssueDetails } from "../../types/xray/responses/importFeature";
import { JiraClientCloud } from "../jira/jiraClientCloud";
import { XrayClient } from "./xrayClient";

type GetTestsJiraData = {
    key: string;
};

export class XrayClientCloud extends XrayClient<
    JWTCredentials,
    JiraClientCloud,
    ImportFeatureResponseCloud,
    ImportExecutionResponseCloud
> {
    /**
     * The URLs of Xray's Cloud API.
     * Note: API v1 would also work, but let's stick to the more recent one.
     */
    public static readonly URL = "https://xray.cloud.getxray.app/api/v2";
    private static readonly URL_GRAPHQL = `${XrayClientCloud.URL}/graphql`;
    private static readonly GRAPHQL_LIMITS = {
        /**
         * @see https://xray.cloud.getxray.app/doc/graphql/gettests.doc.html
         */
        getTests: 100,
    };

    /**
     * Construct a new Xray Cloud client using the provided credentials.
     *
     * @param apiBaseUrl the base URL for all HTTP requests
     * @param credentials the credentials to use during authentication
     * @param jiraClient the configured Jira client
     */
    constructor(credentials: JWTCredentials, jiraClient: JiraClientCloud) {
        super(XrayClientCloud.URL, credentials, jiraClient);
    }

    public getUrlImportExecution(): string {
        return `${this.apiBaseURL}/import/execution`;
    }

    public handleResponseImportExecution(response: ImportExecutionResponseCloud): string {
        return response.key;
    }

    public getUrlExportCucumber(issueKeys?: string[], filter?: number): string {
        const query: string[] = [];
        if (issueKeys) {
            query.push(`keys=${issueKeys.join(";")}`);
        }
        if (filter) {
            query.push(`filter=${filter}`);
        }
        if (query.length === 0) {
            throw new Error("One of issueKeys or filter must be provided to export feature files");
        }
        return `${this.apiBaseURL}/export/cucumber?${query.join("&")}`;
    }

    public getUrlImportFeature(projectKey?: string, projectId?: string): string {
        const query: string[] = [];
        if (projectKey) {
            query.push(`projectKey=${projectKey}`);
        }
        if (projectId) {
            query.push(`projectId=${projectId}`);
        }
        return `${this.apiBaseURL}/import/feature?${query.join("&")}`;
    }

    public handleResponseImportFeature(response: ImportFeatureResponseCloud): void {
        if (response.errors.length > 0) {
            logError("Encountered some errors during import:", ...response.errors);
        }
        if (response.updatedOrCreatedTests.length > 0) {
            logSuccess(
                "Successfully updated or created test issues:",
                response.updatedOrCreatedTests.map((issue: IssueDetails) => issue.key).join(", ")
            );
        }
        if (response.updatedOrCreatedPreconditions.length > 0) {
            logSuccess(
                "Successfully updated or created precondition issues:",
                response.updatedOrCreatedPreconditions
                    .map((issue: IssueDetails) => issue.key)
                    .join(", ")
            );
        }
    }

    public async getTestTypes(
        projectKey: string,
        ...issueKeys: string[]
    ): Promise<{ [key: string]: string }> {
        try {
            if (!issueKeys || issueKeys.length === 0) {
                logWarning("No issue keys provided. Skipping test type retrieval");
                return null;
            }
            const authenticationHeader = await this.credentials.getAuthenticationHeader(
                `${this.apiBaseURL}/authenticate`
            );
            logInfo("Retrieving test types...");
            const progressInterval = this.startResponseInterval(this.apiBaseURL);
            try {
                const types = {};
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
                            start: start,
                            limit: XrayClientCloud.GRAPHQL_LIMITS.getTests,
                        },
                    };
                    const response: GetTestsResponse<GetTestsJiraData> = (
                        await Requests.post(XrayClientCloud.URL_GRAPHQL, paginatedRequest, {
                            headers: {
                                ...authenticationHeader,
                            },
                        })
                    ).data;
                    total = response.data.getTests.total;
                    start = response.data.getTests.start + response.data.getTests.results.length;
                    for (const test of response.data.getTests.results) {
                        types[test.jira.key] = test.testType.name;
                    }
                } while (start && start < total);
                const missingTypes: string[] = [];
                for (const issueKey of issueKeys) {
                    if (!(issueKey in types)) {
                        missingTypes.push(issueKey);
                    }
                }
                if (missingTypes.length > 0) {
                    throw new Error(
                        dedent(`
                            Failed to retrieve test types for issues:

                            ${missingTypes.join("\n")}

                            Make sure these issues exist and are actually test issues
                        `)
                    );
                }
                logSuccess(`Successfully retrieved test types for ${issueKeys.length} issues`);
                return types;
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            logError(`Failed to get test types: ${error}`);
            writeErrorFile(error, "getTestTypes");
        }
    }
}
