import { BasicAuthCredentials, PATCredentials } from "../../authentication/credentials";
import { logError, logSuccess } from "../../logging/logging";
import { ImportExecutionResponseServer } from "../../types/xray/responses/importExecution";
import {
    ImportFeatureResponseServer,
    IssueDetails,
} from "../../types/xray/responses/importFeature";
import { XrayClient } from "./xrayClient";

export class XrayClientServer extends XrayClient<
    ImportFeatureResponseServer,
    ImportExecutionResponseServer
> {
    /**
     * Construct a new Xray Cloud client using the provided credentials.
     *
     * @param apiBaseUrl the base URL for all HTTP requests
     * @param credentials the credentials to use during authentication
     */
    constructor(apiBaseUrl: string, credentials: BasicAuthCredentials | PATCredentials) {
        super(apiBaseUrl, credentials);
    }

    public getUrlImportExecution(): string {
        return `${this.apiBaseURL}/rest/raven/latest/import/execution`;
    }

    public handleResponseImportExecution(response: ImportExecutionResponseServer): string {
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
        return `${this.apiBaseURL}/rest/raven/latest/export/test?${query.join("&")}`;
    }

    public getUrlImportFeature(projectKey: string): string {
        return `${this.apiBaseURL}/rest/raven/latest/import/feature?projectKey=${projectKey}`;
    }

    public handleResponseImportFeature(response: ImportFeatureResponseServer): void {
        // Happens when scenarios cause errors in Xray, e.g. typos in keywords ('Scenariot').
        if (typeof response === "object" && "message" in response) {
            if (response.message) {
                logError("Encountered an error during import:", response.message);
            }
            if (response.testIssues.length > 0) {
                logSuccess(
                    "Successfully updated or created test issues:",
                    response.testIssues.map((issue: IssueDetails) => issue.key).join(", ")
                );
            }
            if (response.preconditionIssues.length > 0) {
                logSuccess(
                    "Successfully updated or created precondition issues:",
                    response.preconditionIssues.map((issue: IssueDetails) => issue.key).join(", ")
                );
            }
        } else if (Array.isArray(response)) {
            logSuccess(
                "Successfully updated or created issues:",
                response.map((issue: IssueDetails) => issue.key).join(", ")
            );
        }
    }
}
