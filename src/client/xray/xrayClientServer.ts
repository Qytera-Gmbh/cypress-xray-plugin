import FormData from "form-data";
import { RequestConfigPost } from "../../https/requests";
import { LOG, Level } from "../../logging/logging";
import { CucumberMultipartFeature } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { CucumberMultipartInfo } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { ImportExecutionResponseServer } from "../../types/xray/responses/importExecution";
import {
    ImportFeatureResponse,
    ImportFeatureResponseServer,
    IssueDetails,
} from "../../types/xray/responses/importFeature";
import { dedent } from "../../util/dedent";
import { AbstractXrayClient } from "./xrayClient";

export class XrayClientServer extends AbstractXrayClient {
    public getUrlImportExecution(): string {
        return `${this.apiBaseUrl}/rest/raven/latest/import/execution`;
    }

    public getUrlExportCucumber(issueKeys?: string[], filter?: number): string {
        const query: string[] = [];
        if (issueKeys) {
            query.push(`keys=${issueKeys.join(";")}`);
        }
        if (filter) {
            query.push(`filter=${filter.toString()}`);
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

    protected handleResponseImportExecution(response: ImportExecutionResponseServer): string {
        return response.testExecIssue.key;
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
                LOG.message(
                    Level.DEBUG,
                    `Encountered an error during feature file import: ${serverResponse.message}`
                );
            }
            if (serverResponse.testIssues && serverResponse.testIssues.length > 0) {
                const testKeys = serverResponse.testIssues.map((test: IssueDetails) => test.key);
                response.updatedOrCreatedIssues.push(...testKeys);
                LOG.message(
                    Level.DEBUG,
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
                LOG.message(
                    Level.DEBUG,
                    dedent(`
                        Successfully updated or created precondition issues:
                        ${preconditionKeys.join(", ")}
                    `)
                );
            }
        } else if (Array.isArray(serverResponse)) {
            const issueKeys = serverResponse.map((test: IssueDetails) => test.key);
            response.updatedOrCreatedIssues.push(...issueKeys);
            LOG.message(
                Level.DEBUG,
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
        cucumberInfo: CucumberMultipartInfo
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
