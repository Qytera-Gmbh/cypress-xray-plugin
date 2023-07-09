import { BasicAuthCredentials, PATCredentials } from "../../authentication/credentials";
import { ImportFeatureResponseServer } from "../../types/xray/responses/importFeature";
import { XrayClient } from "./xrayClient";

export class XrayClientServer extends XrayClient<ImportFeatureResponseServer> {
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
}
