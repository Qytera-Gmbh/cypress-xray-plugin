import type { XrayTestExecutionResults } from "../../models/xray/import-test-execution-results";
import type { CucumberMultipartFeature } from "../../models/xray/requests/import-execution-cucumber-multipart";
import type { MultipartInfo } from "../../models/xray/requests/import-execution-multipart-info";
import type { ImportFeatureResponse } from "../../models/xray/responses/import-feature";

/**
 * Import execution endpoint of Xray clients.
 */
export interface HasImportExecutionEndpoint {
    /**
     * Uploads test results to the Xray instance.
     *
     * @param execution - the test results as provided by Cypress
     * @returns the key of the test execution issue
     * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2
     */
    importExecution(execution: XrayTestExecutionResults): Promise<string>;
}

/**
 * Import execution multipart endpoint of Xray clients.
 */
export interface HasImportExecutionMultipartEndpoint {
    /**
     * Uploads test results to the Xray instance while also allowing modification of arbitrary Jira
     * fields.
     *
     * @param executionResults - the test results as provided by Cypress
     * @param info - the Jira test execution issue information
     * @returns the key of the test execution issue
     * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#ImportExecutionResultsREST-XrayJSONresultsMultipart
     * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2#ImportExecutionResultsRESTv2-XrayJSONresultsMultipart
     */
    importExecutionMultipart(
        executionResults: XrayTestExecutionResults,
        info: MultipartInfo
    ): Promise<string>;
}

/**
 * Import execution Cucumber multipart endpoint of Xray clients.
 */
export interface HasImportExecutionCucumberMultipartEndpoint {
    /**
     * Uploads Cucumber test results to the Xray instance.
     *
     * @param cucumberJson - the test results as provided by the `cypress-cucumber-preprocessor`
     * @param cucumberInfo - the test execution information
     * @returns the key of the test execution issue
     * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#ImportExecutionResultsREST-CucumberJSONresultsMultipart
     * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2
     */
    importExecutionCucumberMultipart(
        cucumberJson: CucumberMultipartFeature[],
        cucumberInfo: MultipartInfo
    ): Promise<string>;
}

/**
 * Import feature endpoint of Xray clients.
 */
export interface HasImportFeatureEndpoint {
    /**
     * Uploads (zipped) feature file(s) to corresponding Xray issues.
     *
     * @param file - the (zipped) Cucumber feature file(s)
     * @param query - the query parameters
     * @returns the response containing updated issues
     * @see https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
     * @see https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
     */
    importFeature(
        file: string,
        query: {
            /**
             * The ID of the project where the tests and pre-conditions are located.
             */
            projectId?: string;
            /**
             * The key of the project where the tests and pre-conditions are located.
             */
            projectKey?: string;
            /**
             * A name designating the source of the features being imported (e.g. the source
             * project name).
             */
            source?: string;
        }
    ): Promise<ImportFeatureResponse>;
}
