import { JWTCredentials } from "../../authentication/credentials";
import { logError, logSuccess } from "../../logging/logging";
import { CucumberMultipartInfoCloud } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { ImportExecutionResponseCloud } from "../../types/xray/responses/importExecution";
import { ImportFeatureResponseCloud, IssueDetails } from "../../types/xray/responses/importFeature";
import { XrayClient } from "./xrayClient";

export class XrayClientCloud extends XrayClient<
    ImportFeatureResponseCloud,
    ImportExecutionResponseCloud,
    CucumberMultipartInfoCloud
> {
    /**
     * The URL of Xray's Cloud API.
     * Note: API v1 would also work, but let's stick to the more recent one.
     */
    public static readonly URL = "https://xray.cloud.getxray.app/api/v2";

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

    public getUrlImportFeature(projectKey: string): string {
        return `${this.apiBaseURL}/import/feature?projectKey=${projectKey}`;
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

    public getUrlImportExecutionCucumberMultipart(): string {
        return `${this.apiBaseURL}/import/execution/cucumber/multipart`;
    }

    public handleResponseImportExecutionCucumberMultipart(
        response: ImportExecutionResponseCloud
    ): string {
        return response.key;
    }
}
