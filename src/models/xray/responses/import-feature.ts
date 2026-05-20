export interface IssueDetails {
    id: string;
    key: string;
    self: string;
}
export interface IssueType {
    id: string;
    name: string;
}
/**
 * The cucumber features were successfully imported to Xray.
 *
 * @see https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
 */
export type ImportFeatureResponseServerSuccess = (IssueDetails & {
    issueType: IssueType;
})[];
/**
 * Cucumber feature import failed.
 *
 * @see https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
 */
export interface ImportFeatureResponseServerFailure {
    message: string;
    preconditionIssues?: IssueDetails[];
    testIssues?: IssueDetails[];
}
export type ImportFeatureResponseServer =
    | ImportFeatureResponseServerFailure
    | ImportFeatureResponseServerSuccess;
/**
 * The cucumber features were successfully imported.
 *
 * @see https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
 */
export interface ImportFeatureResponseCloud {
    errors: string[];
    updatedOrCreatedPreconditions: IssueDetails[];
    updatedOrCreatedTests: IssueDetails[];
}

/**
 * Models a summarized response when importing Cucumber feature files to Xray.
 */
export interface ImportFeatureResponse {
    /**
     * All errors which occurred during import.
     */
    errors: string[];
    /**
     * The Jira issue keys of issues created or updated during import.
     */
    updatedOrCreatedIssues: string[];
}
