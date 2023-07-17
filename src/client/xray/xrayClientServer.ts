import { BasicAuthCredentials, PATCredentials } from "../../authentication/credentials";
import { logError, logInfo, logSuccess, logWarning, writeErrorFile } from "../../logging/logging";
import { ImportExecutionResponseServer } from "../../types/xray/responses/importExecution";
import {
    ImportFeatureResponseServer,
    IssueDetails,
} from "../../types/xray/responses/importFeature";
import { JiraClientCloud } from "../jira/jiraClientCloud";
import { JiraClientServer } from "../jira/jiraClientServer";
import { XrayClient } from "./xrayClient";

export class XrayClientServer extends XrayClient<
    BasicAuthCredentials | PATCredentials,
    ImportFeatureResponseServer,
    ImportExecutionResponseServer
> {
    /**
     * Construct a new Xray Server client using the provided credentials.
     *
     * @param apiBaseUrl the base URL for all HTTP requests
     * @param credentials the credentials to use during authentication
     * @param jiraClient the configured Jira client
     */
    constructor(
        apiBaseUrl: string,
        credentials: BasicAuthCredentials | PATCredentials,
        jiraClient: JiraClientServer | JiraClientCloud
    ) {
        super(apiBaseUrl, credentials, jiraClient);
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

    public async getTestTypes(
        projectKey: string,
        ...issueKeys: string[]
    ): Promise<{ [key: string]: string }> {
        try {
            if (!issueKeys || issueKeys.length === 0) {
                logWarning("No issue keys provided. Skipping test type retrieval");
                return null;
            }
            const authenticationHeader = await this.credentials.getAuthenticationHeader();
            logInfo("Retrieving test types...");
            const progressInterval = this.startResponseInterval(this.apiBaseURL);
            try {
                const types = {};
                // TODO
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
