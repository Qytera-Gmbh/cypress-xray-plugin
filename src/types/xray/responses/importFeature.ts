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
export interface ImportFeatureResponseServerSuccess extends IssueDetails {
    issueType: IssueType;
}
/**
 * Cucumber feature import failed.
 *
 * @see https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
 */
export interface ImportFeatureResponseServerFailure {
    testIssues: IssueDetails[];
    preconditionIssues: IssueDetails[];
    message: string;
}
export type ImportFeatureResponseServer =
    | ImportFeatureResponseServerSuccess
    | ImportFeatureResponseServerFailure;
/**
 * The cucumber features were successfully imported.
 *
 * @see https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
 */
export interface ImportFeatureResponseCloud {
    errors: string[];
    updatedOrCreatedTests: IssueDetails[];
    updatedOrCreatedPreconditions: IssueDetails[];
}
