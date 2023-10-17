export type IssueDetails = {
    id: string;
    key: string;
    self: string;
};
export type IssueType = {
    id: string;
    name: string;
};
/**
 * The cucumber features were successfully imported to Xray.
 *
 * @see https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
 */
export type ImportFeatureResponseServerSuccess = IssueDetails & {
    issueType: IssueType;
};
/**
 * Cucumber feature import failed.
 *
 * @see https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
 */
export type ImportFeatureResponseServerFailure = {
    testIssues: IssueDetails[];
    preconditionIssues: IssueDetails[];
    message: string;
};
export type ImportFeatureResponseServer =
    | ImportFeatureResponseServerSuccess
    | ImportFeatureResponseServerFailure;
/**
 * The cucumber features were successfully imported.
 *
 * @see https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
 */
export type ImportFeatureResponseCloud = {
    errors: string[];
    updatedOrCreatedTests: IssueDetails[];
    updatedOrCreatedPreconditions: IssueDetails[];
};
