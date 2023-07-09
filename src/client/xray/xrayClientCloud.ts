import { JWTCredentials } from "../../authentication/credentials";
import { ImportFeatureResponseCloud } from "../../types/xray/responses/importFeature";
import { XrayClient } from "./xrayClient";

export class XrayClientCloud extends XrayClient<ImportFeatureResponseCloud> {
    /**
     * The URL of Xray's Cloud API.
     * Note: API v1 would also work, but let's stick to the more recent one.
     */
    private static readonly URL = "https://xray.cloud.getxray.app/api/v2";

    /**
     * Construct a new Xray Cloud client using the provided credentials.
     *
     * @param apiBaseUrl the base URL for all HTTP requests
     * @param credentials the credentials to use during authentication
     */
    constructor(credentials: JWTCredentials) {
        super(XrayClientCloud.URL, credentials);
    }

    public getUrlImportExecution(): string {
        return `${this.apiBaseURL}/import/execution`;
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

    public getUrlImportFeature(projectKey: string): string {
        return `${this.apiBaseURL}/import/feature?projectKey=${projectKey}`;
    }
}
