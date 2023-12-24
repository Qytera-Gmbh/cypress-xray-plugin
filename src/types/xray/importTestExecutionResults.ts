import { DateTimeISO } from "../util";

/**
 * Taken from:
 *
 * Xray Server: https://docs.getxray.app/display/XRAY/Import+Execution+Results
 *
 * Xray Cloud: https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results
 *
 * Schemes transformed into TypeScript using https://github.com/bcherny/json-schema-to-typescript.
 */
export interface IXrayTestExecutionResults {
    /**
     * The test execution key where to import the execution results.
     */
    testExecutionKey?: string;
    /**
     * The info object for creating new test execution issues.
     */
    info?: XrayTestExecutionInfo;
    /**
     * The test run result details.
     */
    tests?: [IXrayTest, ...IXrayTest[]];
}

/**
 * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results#ImportExecutionResults-%22info%22object-TestExecutionissue
 * @see https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results#UsingXrayJSONformattoimportexecutionresults-%22info%22object-TestExecutionissue
 */
export interface XrayTestExecutionInfo {
    /**
     * The project key where the test execution will be created.
     */
    project?: string;
    /**
     * The summary for the test execution issue.
     */
    summary?: string;
    /**
     * The description for the test execution issue.
     */
    description?: string;
    /**
     * The version name for the fix version field of the test execution issue.
     */
    version?: string;
    /**
     * A revision for the revision custom field.
     */
    revision?: string;
    /**
     * The username for the Jira user who executed the tests.
     */
    user?: string;
    /**
     * The start date for the test execution issue.
     */
    startDate?: DateTimeISO;
    /**
     * The finish date for the test execution issue.
     */
    finishDate?: DateTimeISO;
    /**
     * The test plan key for associating the test execution issue.
     */
    testPlanKey?: string;
    /**
     * The test environments for the test execution issue.
     */
    testEnvironments?: string[];
}

export interface IXrayTest {
    /**
     * The test issue key.
     */
    testKey?: string;
    /**
     * The test info element.
     */
    testInfo?: IXrayTestInfo;
    /**
     * The start date for the test run.
     */
    start?: DateTimeISO;
    /**
     * The finish date for the test run.
     */
    finish?: DateTimeISO;
    /**
     * The comment for the test run.
     */
    comment?: string;
    /**
     * The user id who executed the test run.
     */
    executedBy?: string;
    /**
     * The user id for the assignee of the test run.
     */
    assignee?: string;
    /**
     * The test run status.
     */
    status: string;
    /**
     * The step results.
     */
    steps?: IXrayManualTestStepResult[];
    /**
     * The example results for BDD tests.
     */
    examples?: (XrayExamplesTypeServer | XrayExamplesTypeCloud)[];
    /**
     * The iteration containing data-driven test results.
     */
    iterations?: IXrayIterationResult[];
    /**
     * An array of defect issue keys to associate with the test run.
     */
    defects?: string[];
    /**
     * An array of evidence items of the test run.
     */
    evidence?: XrayEvidenceItem[];
    /**
     * An array of custom fields for the test run.
     */
    customFields?: IXrayCustomField[];
}
/**
 * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results#ImportExecutionResults-%22tests%22object-TestRundetails
 */
export type XrayTestServer = IXrayTest;
export type XrayExamplesTypeServer = "TODO" | "FAIL" | "PASS" | "EXECUTING";
/**
 * @see https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results#UsingXrayJSONformattoimportexecutionresults-%22test%22object-TestRundetails
 */
export type XrayTestCloud = IXrayTest;
export type XrayExamplesTypeCloud = "TODO" | "FAILED" | "PASSED" | "EXECUTING";

export interface IXrayTestInfo {
    /**
     * The summary for the test issue.
     */
    summary: string;
    /**
     * The project key where the test issue will be created.
     */
    projectKey: string;
    /**
     * An array of requirement issue keys to associate with the test.
     */
    requirementKeys?: string[];
    /**
     * The test issue labels.
     */
    labels?: string[];
    /**
     * An array of test steps (for manual tests).
     */
    steps?: {
        /**
         * The step action.
         */
        action: string;
        /**
         * The step data.
         */
        data?: string;
        /**
         * The step expected result.
         */
        result?: string;
    }[];
    /**
     * The BDD scenario.
     */
    scenario?: string;
    /**
     * The generic test definition.
     */
    definition?: string;
}
/**
 * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results#ImportExecutionResults-%22testInfo%22object-CreatingTestissues
 */
export interface XrayTestInfoServer extends IXrayTestInfo {
    /**
     * The description of the test issue.
     */
    description?: string;
    /**
     * The test type (e.g. Manual, Cucumber, Generic).
     */
    testType: string;
    /**
     * The BDD scenario type (scenario or scenario outline).
     */
    scenarioType?: string;
}
/**
 * @see https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results#UsingXrayJSONformattoimportexecutionresults-%22testInfo%22object-CreatingTestissues
 */
export interface XrayTestInfoCloud extends IXrayTestInfo {
    /**
     * The test type (e.g. Manual, Cucumber, Generic).
     */
    type: string;
    /**
     * An array of test steps (for manual tests).
     */
    steps?: {
        /**
         * Any other step custom fields.
         */
        [k: string]: NonNullable<unknown>;
        /**
         * The step action.
         */
        action: string;
    }[];
}

export interface IXrayManualTestStepResult {
    /**
     * The status for the test step.
     */
    status: string;
    /**
     * The comment for the step result.
     */
    comment?: string;
    /**
     * An array of defect issue keys to associate with the test run.
     */
    defects?: string[];
    /**
     * The actual result field for the step result.
     */
    actualResult?: string;
}
export interface XrayManualTestStepResultServer extends IXrayManualTestStepResult {
    /**
     * An array of evidence items of the test run.
     */
    evidences?: XrayEvidenceItem[];
}
/**
 * @see https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results#UsingXrayJSONformattoimportexecutionresults-%22stepresult%22object-stepresults
 */
export interface XrayManualTestStepResultCloud extends IXrayManualTestStepResult {
    /**
     * An array of evidence items of the test run.
     */
    evidence?: XrayEvidenceItem[];
}
/**
 * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results#ImportExecutionResults-%22evidence%22object-embeddedattachments
 * @see https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results#UsingXrayJSONformattoimportexecutionresults-%22evidence%22object-embeddedattachments
 */
export interface XrayEvidenceItem {
    /**
     * The attachment data encoded in base64.
     */
    data: Base64String;
    /**
     * The file name for the attachment.
     */
    filename: string;
    /**
     * The Content-Type representation header is used to indicate the original
     * media type of the resource.
     */
    contentType?: string;
}

export interface IXrayIterationResult {
    /**
     * An array of parameters along with their values.
     */
    parameters?: {
        /**
         * The parameter value.
         */
        value?: string;
    }[];
    /**
     * The status for the iteration.
     */
    status: string;
    /**
     * An array of step results (for manual tests).
     */
    steps?: IXrayManualTestStepResult[];
}
/**
 * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results#ImportExecutionResults-%22iterations%22object-Data-driventestresults
 */
export interface XrayIterationResultServer extends IXrayIterationResult {
    /**
     * An array of parameters along with their values.
     */
    parameters?: {
        /**
         * The parameter name.
         */
        name?: string;
        /**
         * The parameter value.
         */
        value?: string;
    }[];
}
/**
 * @see https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results#UsingXrayJSONformattoimportexecutionresults-%22iteration%22object-Data-driventestresults
 */
export interface XrayIterationResultCloud extends IXrayIterationResult {
    /**
     * The iteration name.
     */
    name?: string;
    /**
     * An array of parameters along with their values.
     */
    parameters?: {
        /**
         * The parameter name.
         */
        name: string;
        /**
         * The parameter value.
         */
        value?: string;
    }[];
    /**
     * The log for the iteration.
     */
    log?: string;
    /**
     * A duration for the iteration.
     */
    duration?: string;
}
/**
 * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results#ImportExecutionResults-%22customFields%22object-storetestruncustomfields
 */
export interface IXrayCustomField {
    /**
     * The test run custom field ID.
     */
    id: string;
    /**
     * The test run custom field value.
     */
    value: unknown;
}
/**
 * @see https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results#UsingXrayJSONformattoimportexecutionresults-%22customField%22object-storetestruncustomfields
 */
export interface XrayCustomFieldCloud extends IXrayCustomField {
    /**
     * The test run custom field name.
     */
    name: string;
}

// Small utility type to better express meaning.
export type Base64String = string;
