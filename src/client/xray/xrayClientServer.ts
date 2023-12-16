import FormData from "form-data";
import { BasicAuthCredentials, PATCredentials } from "../../authentication/credentials";
import { RequestConfigPost } from "../../https/requests";
import { logDebug, logError } from "../../logging/logging";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { ICucumberMultipartInfo } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { ImportExecutionResponseServer } from "../../types/xray/responses/importExecution";
import {
    ImportFeatureResponse,
    ImportFeatureResponseServer,
    IssueDetails,
} from "../../types/xray/responses/importFeature";
import { dedent } from "../../util/dedent";
import { XrayClient } from "./xrayClient";

export class XrayClientServer extends XrayClient {
    /**
     * Construct a new Xray Server client using the provided credentials.
     *
     * @param apiBaseUrl - the base URL for all HTTP requests
     * @param credentials - the credentials to use during authentication
     */
    constructor(apiBaseUrl: string, credentials: BasicAuthCredentials | PATCredentials) {
        super(apiBaseUrl, credentials);
    }

    public getUrlImportExecution(): string {
        return `${this.apiBaseUrl}/rest/raven/latest/import/execution`;
    }

    protected handleResponseImportExecution(response: ImportExecutionResponseServer): string {
        return response.testExecIssue.key;
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
        // Always zip feature files, even single ones.
        query.push("fz=true");
        return `${this.apiBaseUrl}/rest/raven/latest/export/test?${query.join("&")}`;
    }

    public getUrlImportFeature(projectKey: string): string {
        return `${this.apiBaseUrl}/rest/raven/latest/import/feature?projectKey=${projectKey}`;
    }

    protected handleResponseImportFeature(
        serverResponse: ImportFeatureResponseServer
    ): ImportFeatureResponse {
        const response: ImportFeatureResponse = {
            errors: [],
            updatedOrCreatedIssues: [],
        };
        // Happens when scenarios cause errors in Xray, e.g. typos in keywords ('Scenariot').
        if (typeof serverResponse === "object" && "message" in serverResponse) {
            if (serverResponse.message) {
                response.errors.push(serverResponse.message);
                logError(
                    `Encountered an error during feature file import: ${serverResponse.message}`
                );
            }
            if (serverResponse.testIssues && serverResponse.testIssues.length > 0) {
                const testKeys = serverResponse.testIssues.map((test: IssueDetails) => test.key);
                response.updatedOrCreatedIssues.push(...testKeys);
                logDebug(
                    dedent(`
                        Successfully updated or created test issues:
                        ${testKeys.join(", ")}
                    `)
                );
            }
            if (serverResponse.preconditionIssues && serverResponse.preconditionIssues.length > 0) {
                const preconditionKeys = serverResponse.preconditionIssues.map(
                    (test: IssueDetails) => test.key
                );
                response.updatedOrCreatedIssues.push(...preconditionKeys);
                logDebug(
                    dedent(`
                        Successfully updated or created precondition issues:
                        ${preconditionKeys.join(", ")}
                    `)
                );
            }
        } else if (Array.isArray(serverResponse)) {
            const issueKeys = serverResponse.map((test: IssueDetails) => test.key);
            response.updatedOrCreatedIssues.push(...issueKeys);
            logDebug(
                dedent(`
                    Successfully updated or created issues:
                    ${issueKeys.join(", ")}
                `)
            );
        }
        return response;
    }

    protected async prepareRequestImportExecutionCucumberMultipart(
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: ICucumberMultipartInfo
    ): Promise<RequestConfigPost<FormData>> {
        const formData = new FormData();
        const resultString = JSON.stringify(cucumberJson);
        const infoString = JSON.stringify(cucumberInfo);
        formData.append("result", resultString, {
            filename: "results.json",
        });
        formData.append("info", infoString, {
            filename: "info.json",
        });
        const authorizationHeader = await this.credentials.getAuthorizationHeader();
        return {
            url: `${this.apiBaseUrl}/rest/raven/latest/import/execution/cucumber/multipart`,
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
        response: ImportExecutionResponseServer
    ): string {
        return response.testExecIssue.key;
    }
}
