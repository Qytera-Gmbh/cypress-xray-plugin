import FormData from "form-data";
import { CucumberMultipartFeature } from "../../types/xray/requests/import-execution-cucumber-multipart";
import { CucumberMultipartInfo } from "../../types/xray/requests/import-execution-cucumber-multipart-info";
import { ImportExecutionResponseServer } from "../../types/xray/responses/import-execution";
import {
    ImportFeatureResponse,
    ImportFeatureResponseServer,
    IssueDetails,
} from "../../types/xray/responses/import-feature";
import { dedent } from "../../util/dedent";
import { LOG, Level } from "../../util/logging";
import { RequestConfigPost } from "../https/requests";
import { AbstractXrayClient } from "./xray-client";

export class XrayClientServer extends AbstractXrayClient {
    public getUrlImportExecution(): string {
        return `${this.apiBaseUrl}/rest/raven/latest/import/execution`;
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
        if (Array.isArray(serverResponse)) {
            const issueKeys = serverResponse.map((test: IssueDetails) => test.key);
            response.updatedOrCreatedIssues.push(...issueKeys);
            LOG.message(
                Level.DEBUG,
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
