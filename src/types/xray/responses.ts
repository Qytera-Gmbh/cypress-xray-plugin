export interface ImportIssueResponse {
    id: string;
    key: string;
    self: string;
    issueType?: {
        id: string;
        name: string;
    };
}

/**
 * https://docs.getxray.app/display/XRAYCLOUD/Exporting+Cucumber+Tests+-+REST+v2
 * Content type: application/octet-stream
 * A compressed zip file containing the generated feature files.
 */
export interface ExportCucumberTestsResponse {
    data: string;
}

/**
 * The cucumber features were successfully imported to Jira.
 *
 * Content type: application/octet-stream
 *
 * @see https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
 */
export interface CloudImportCucumberTestsResponse {
    errors: string[];
    updatedOrCreatedTests: ImportIssueResponse[];
    updatedOrCreatedPreconditions: ImportIssueResponse[];
}

/**
 * The cucumber features were successfully imported to Jira.
 *
 * Content type: application/octet-stream
 *
 * @see https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
 */
export interface ServerImportCucumberTestsResponse {
    message: string;
    testIssues: ImportIssueResponse[];
    preConditionIssues: ImportIssueResponse[];
}
