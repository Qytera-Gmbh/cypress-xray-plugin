import { CypressRunResultType } from "../../../../../../types/cypress/cypress";
import { IssueTypeDetails } from "../../../../../../types/jira/responses/issue-type-details";
import {
    CucumberMultipartInfo,
    CucumberMultipartInfoCloud,
} from "../../../../../../types/xray/requests/import-execution-cucumber-multipart-info";
import { dedent } from "../../../../../../util/dedent";

/**
 * Interface containing general/minimal Cypress run data.
 */
export type RunData = Pick<
    CypressRunResultType,
    "browserName" | "browserVersion" | "cypressVersion" | "startedTestsAt"
>;

/**
 * Additional information used by test execution issues when uploading Cucumber results.
 */
export interface TestExecutionIssueData {
    description?: string;
    issuetype: IssueTypeDetails;
    labels?: string[];
    projectKey: string;
    summary?: string;
    testEnvironments?: {
        environments: [string, ...string[]];
    };
    testPlan?: {
        issueKey: string;
    };
}

/**
 * Additional information used by test execution issues when uploading Cucumber results.
 */
export interface TestExecutionIssueDataServer extends TestExecutionIssueData {
    testEnvironments?: {
        environments: [string, ...string[]];
        fieldId: string;
    };
    testPlan?: {
        fieldId: string;
        issueKey: string;
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
): CucumberMultipartInfo {
    const multipartInfo: CucumberMultipartInfo = {
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
        multipartInfo.fields[testExecutionIssueData.testPlan.fieldId] =
            testExecutionIssueData.testPlan.issueKey;
    }
    if (testExecutionIssueData.testEnvironments) {
        multipartInfo.fields[testExecutionIssueData.testEnvironments.fieldId] =
            testExecutionIssueData.testEnvironments.environments;
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
): CucumberMultipartInfoCloud {
    return {
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
            environments: testExecutionIssueData.testEnvironments?.environments,
            testPlanKey: testExecutionIssueData.testPlan?.issueKey,
        },
    };
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
