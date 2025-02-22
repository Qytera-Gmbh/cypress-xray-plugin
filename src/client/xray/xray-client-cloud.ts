import type { AxiosResponse } from "axios";
import FormData from "form-data";
import { JsonStreamStringify } from "json-stream-stringify";
import type {
    XrayEvidenceItem,
    XrayTestExecutionResults,
} from "../../types/xray/import-test-execution-results";
import type { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import type { MultipartInfo } from "../../types/xray/requests/import-execution-multipart-info";
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

export class XrayClientCloud extends AbstractXrayClient<
    ImportFeatureResponseCloud,
    ImportExecutionResponseCloud
> {
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

    /**
     * Mutation used to add evidence to a test run.
     *
     * @example
     *
     * ```ts
     * addEvidenceToTestRun(
     *   {
     *     id: "5acc7ab0a3fe1b6fcdc3c737",
     *     evidence: [
     *       {
     *         filename: "evidence.txt"
     *         mimeType: "text/plain"
     *         data: "SGVsbG8gV29ybGQ="
     *       }
     *     ]
     *   },
     *   (addEvidenceResult) => [
     *     addEvidenceResult.addedEvidence,
     *     addEvidenceResult.warnings,
     *   ]
     * );
     *
     * // Equivalent to:
     * // mutation {
     * //   addEvidenceToTestRun(
     * //     id: "5acc7ab0a3fe1b6fcdc3c737",
     * //     evidence: [
     * //       {
     * //         filename: "evidence.txt"
     * //         mimeType: "text/plain"
     * //         data: "SGVsbG8gV29ybGQ="
     * //       }
     * //     ]
     * //   ) {
     * //     addedEvidence
     * //     warnings
     * //   }
     * // }
     * ```
     *
     * @param variables - the GraphQL variable values
     * @param resultShape - the desired shape of the result
     * @returns the result
     *
     * @see https://us.xray.cloud.getxray.app/doc/graphql/addevidencetotestrun.doc.html
     */
    @loggedRequest({ purpose: "add evidence to test run" })
    public async addEvidenceToTestRun(variables: {
        /**
         * The evidence to add to the test run.
         */
        evidence: readonly XrayEvidenceItem[];
        /**
         * The ID of the test run.
         */
        id: string;
    }): Promise<{
        /**
         * IDs of the added evidence.
         */
        addedEvidence: string[];
        /**
         * Warnings generated during the operation.
         */
        warnings: string[];
    }> {
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        const mutation = dedent(`
            mutation {
                addEvidenceToTestRun(
                    id: ${JSON.stringify(variables.id)},
                    evidence: ${JSON.stringify(variables.evidence)}
                ) {
                    addedEvidence
                    warnings
                }
            }
       `);
        const response: AxiosResponse<{
            data: { addEvidenceToTestRun: { addedEvidence: string[]; warnings: string[] } };
        }> = await this.httpClient.post(
            `${XrayClientCloud.URL}/graphql`,
            { mutation },
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
                formData.append("results", new JsonStreamStringify(cucumberJson), {
                    filename: "results.json",
                });
                formData.append("info", new JsonStreamStringify(cucumberInfo), {
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
                formData.append("results", new JsonStreamStringify(executionResults), {
                    filename: "results.json",
                });
                formData.append("info", new JsonStreamStringify(info), {
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
