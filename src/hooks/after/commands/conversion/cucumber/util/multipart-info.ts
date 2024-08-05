import { CypressRunResultType } from "../../../../../../types/cypress/cypress";
import { IssueTypeDetails } from "../../../../../../types/jira/responses/issue-type-details";
import {
    MultipartInfo,
    MultipartInfoCloud,
} from "../../../../../../types/xray/requests/import-execution-multipart-info";
import { dedent } from "../../../../../../util/dedent";

/**
 * Interface containing general/minimal Cypress run data.
 */
export type RunData = Pick<
    CypressRunResultType,
    "browserName" | "browserVersion" | "cypressVersion" | "endedTestsAt" | "startedTestsAt"
>;

/**
 * Additional information used by test execution issues when uploading Cucumber results.
 */
export interface TestExecutionIssueData {
    custom?: Record<string, unknown>;
    description?: string;
    issuetype: IssueTypeDetails;
    labels?: string[];
    projectKey: string;
    summary?: string;
    testEnvironments?: {
        value: [string, ...string[]];
    };
    testPlan?: {
        value: string;
    };
}

/**
 * Additional information used by test execution issues when uploading Cucumber results.
 */
export interface TestExecutionIssueDataServer extends TestExecutionIssueData {
    testEnvironments?: {
        fieldId: string;
        value: [string, ...string[]];
    };
    testPlan?: {
        fieldId: string;
        value: string;
    };
}

/**
 * Converts Cypress run data into Cucumber multipart information, which could be used when creating
 * new test executions on import or when updating existing ones.
 *
 * @param runData - Cypress run data
 * @param testExecutionIssueData - additional information to consider
 * @returns the Cucumber multipart information data for Xray server
 */
export function buildMultipartInfoServer(
    runData: RunData,
    testExecutionIssueData: TestExecutionIssueDataServer
): MultipartInfo {
    const multipartInfo: MultipartInfo = {
        fields: {
            description:
                testExecutionIssueData.description ??
                defaultDescription(
                    runData.cypressVersion,
                    runData.browserName,
                    runData.browserVersion
                ),
            issuetype: testExecutionIssueData.issuetype,
            project: {
                key: testExecutionIssueData.projectKey,
            },
            summary:
                testExecutionIssueData.summary ??
                defaultSummary(new Date(runData.startedTestsAt).getTime()),
        },
    };
    if (testExecutionIssueData.testPlan) {
        multipartInfo.fields[testExecutionIssueData.testPlan.fieldId] = [
            testExecutionIssueData.testPlan.value,
        ];
    }
    if (testExecutionIssueData.testEnvironments) {
        multipartInfo.fields[testExecutionIssueData.testEnvironments.fieldId] =
            testExecutionIssueData.testEnvironments.value;
    }
    if (testExecutionIssueData.custom) {
        for (const [key, value] of Object.entries(testExecutionIssueData.custom)) {
            multipartInfo.fields[key] = value;
        }
    }
    return multipartInfo;
}

/**
 * Converts Cypress run data into Cucumber multipart information, which could be used when creating
 * new test executions on import or when updating existing ones.
 *
 * @param runData - Cypress run data
 * @param testExecutionIssueData - additional information to consider
 * @returns the Cucumber multipart information data for Xray cloud
 */
export function buildMultipartInfoCloud(
    runData: RunData,
    testExecutionIssueData: TestExecutionIssueData
): MultipartInfoCloud {
    const multipartInfo: MultipartInfoCloud = {
        fields: {
            description:
                testExecutionIssueData.description ??
                defaultDescription(
                    runData.cypressVersion,
                    runData.browserName,
                    runData.browserVersion
                ),
            issuetype: testExecutionIssueData.issuetype,
            project: {
                key: testExecutionIssueData.projectKey,
            },
            summary:
                testExecutionIssueData.summary ??
                defaultSummary(new Date(runData.startedTestsAt).getTime()),
        },
        xrayFields: {
            environments: testExecutionIssueData.testEnvironments?.value,
            testPlanKey: testExecutionIssueData.testPlan?.value,
        },
    };
    if (testExecutionIssueData.custom) {
        for (const [key, value] of Object.entries(testExecutionIssueData.custom)) {
            multipartInfo.fields[key] = value;
        }
    }
    return multipartInfo;
}

function defaultSummary(timestamp: number): string {
    return `Execution Results [${timestamp.toString()}]`;
}

function defaultDescription(
    cypressVersion: string,
    browserName: string,
    browserVersion: string
): string {
    return dedent(`
        Cypress version: ${cypressVersion}
        Browser: ${browserName} (${browserVersion})
    `);
}
