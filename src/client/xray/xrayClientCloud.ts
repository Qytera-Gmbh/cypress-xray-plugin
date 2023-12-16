import FormData from "form-data";
import { JWTCredentials } from "../../authentication/credentials";
import { RequestConfigPost, Requests } from "../../https/requests";
import { logDebug, logError, logWarning, writeErrorFile } from "../../logging/logging";
import { StringMap } from "../../types/util";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { ICucumberMultipartInfo } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { GetTestsResponse } from "../../types/xray/responses/graphql/getTests";
import { ImportExecutionResponseCloud } from "../../types/xray/responses/importExecution";
import {
    ImportFeatureResponse,
    ImportFeatureResponseCloud,
    IssueDetails,
} from "../../types/xray/responses/importFeature";
import { dedent } from "../../util/dedent";
import { IXrayClient, XrayClient } from "./xrayClient";

type GetTestsJiraData = {
    key: string;
};

export interface IXrayClientCloud extends IXrayClient {
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

export class XrayClientCloud extends XrayClient implements IXrayClientCloud {
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
     * Construct a new Xray cloud client using the provided credentials.
     *
     * @param credentials - the credentials to use during authentication
     */
    constructor(credentials: JWTCredentials) {
        super(XrayClientCloud.URL, credentials);
    }

    public getUrlImportExecution(): string {
        return `${this.apiBaseUrl}/import/execution`;
    }

    protected handleResponseImportExecution(response: ImportExecutionResponseCloud): string {
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
        return `${this.apiBaseUrl}/export/cucumber?${query.join("&")}`;
    }

    public getUrlImportFeature(projectKey?: string, projectId?: string): string {
        const query: string[] = [];
        if (projectKey) {
            query.push(`projectKey=${projectKey}`);
        }
        if (projectId) {
            query.push(`projectId=${projectId}`);
        }
        return `${this.apiBaseUrl}/import/feature?${query.join("&")}`;
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
            logError("Encountered some errors during import:", ...cloudResponse.errors);
        }
        if (cloudResponse.updatedOrCreatedTests.length > 0) {
            response.updatedOrCreatedIssues.push(...cloudResponse.updatedOrCreatedTests);
            logDebug(
                "Successfully updated or created test issues:",
                cloudResponse.updatedOrCreatedTests
                    .map((issue: IssueDetails) => issue.key)
                    .join(", ")
            );
        }
        if (cloudResponse.updatedOrCreatedPreconditions.length > 0) {
            response.updatedOrCreatedIssues.push(...cloudResponse.updatedOrCreatedPreconditions);
            logDebug(
                "Successfully updated or created precondition issues:",
                cloudResponse.updatedOrCreatedPreconditions
                    .map((issue: IssueDetails) => issue.key)
                    .join(", ")
            );
        }
        return response;
    }

    public async getTestTypes(
        projectKey: string,
        ...issueKeys: string[]
    ): Promise<StringMap<string>> {
        try {
            if (!issueKeys || issueKeys.length === 0) {
                logWarning("No issue keys provided. Skipping test type retrieval");
                return {};
            }
            const authorizationHeader = await this.credentials.getAuthorizationHeader();
            logDebug("Retrieving test types...");
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
                            start: start,
                            limit: XrayClientCloud.GRAPHQL_LIMITS.getTests,
                        },
                    };
                    const response: GetTestsResponse<GetTestsJiraData> = (
                        await Requests.post(XrayClientCloud.URL_GRAPHQL, paginatedRequest, {
                            headers: {
                                ...authorizationHeader,
                            },
                        })
                    ).data;
                    total = response.data.getTests.total ?? total;
                    if (response.data.getTests.results) {
                        if (typeof response.data.getTests.start === "number") {
                            start =
                                response.data.getTests.start +
                                response.data.getTests.results.length;
                        }
                        for (const test of response.data.getTests.results) {
                            if (test?.jira.key && test.testType?.name) {
                                types[test.jira.key] = test.testType.name;
                            }
                        }
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
                logDebug(`Successfully retrieved test types for ${issueKeys.length} issues`);
                return types;
            } finally {
                clearInterval(progressInterval);
            }
        } catch (error: unknown) {
            logError(`Failed to get test types: ${error}`);
            writeErrorFile(error, "getTestTypes");
        }
        return {};
    }

    protected async prepareRequestImportExecutionCucumberMultipart(
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: ICucumberMultipartInfo
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
            url: `${this.apiBaseUrl}/import/execution/cucumber/multipart`,
            data: formData,
            config: {
                headers: {
                    ...authorizationHeader,
                    ...formData.getHeaders(),
                },
            },
        };
    }

    protected handleResponseImportExecutionCucumberMultipart(
        response: ImportExecutionResponseCloud
    ): string {
        return response.key;
    }
}
