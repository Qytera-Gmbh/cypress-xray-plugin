export interface ImportExecutionResultsResponse {
    id: string;
    key: string;
    self: string;
}

export interface ExportFeatureFileResponse {
    /**
     * https://docs.getxray.app/display/XRAYCLOUD/Exporting+Cucumber+Tests+-+REST+v2
     * Content type: application/octet-stream
     * A compressed zip file containing the generated feature files.
     */
    data: string;
}
