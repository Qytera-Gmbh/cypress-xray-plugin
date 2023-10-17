import { IIssueTypeDetails } from "../../types/jira/responses/issueTypeDetails";
import {
    CucumberMultipartInfoCloud,
    CucumberMultipartInfoServer,
} from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { dedent } from "../../util/dedent";

/**
 * Interface containing general/minimal Cypress run data.
 */
export type RunData = Pick<
    CypressCommandLine.CypressRunResult,
    "browserName" | "browserVersion" | "cypressVersion" | "startedTestsAt"
>;

/**
 * Additional information used by test execution issues when uploading Cucumber results.
 */
export interface TestExecutionIssueData {
    projectKey: string;
    issuetype: IIssueTypeDetails;
    summary?: string;
    description?: string;
    testPlan?: {
        issueKey: string;
    };
    testEnvironments?: {
        environments: [string, ...string[]];
    };
    labels?: string[];
}

/**
 * Additional information used by test execution issues when uploading Cucumber results.
 */
export interface TestExecutionIssueDataServer extends TestExecutionIssueData {
    testPlan?: {
        issueKey: string;
        fieldId: string;
    };
    testEnvironments?: {
        environments: [string, ...string[]];
        fieldId: string;
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
export function getMultipartInfoServer(
    runData: RunData,
    testExecutionIssueData: TestExecutionIssueDataServer
): CucumberMultipartInfoServer {
    const multipartInfo: CucumberMultipartInfoServer = {
        fields: {
            project: {
                key: testExecutionIssueData.projectKey,
            },
            summary:
                testExecutionIssueData.summary ??
                defaultSummary(new Date(runData.startedTestsAt).getTime()),
            description:
                testExecutionIssueData.description ??
                defaultDescription(
                    runData.cypressVersion,
                    runData.browserName,
                    runData.browserVersion
                ),
            issuetype: testExecutionIssueData.issuetype,
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
export function getMultipartInfoCloud(
    runData: RunData,
    testExecutionIssueData: TestExecutionIssueData
): CucumberMultipartInfoCloud {
    return {
        fields: {
            project: {
                key: testExecutionIssueData.projectKey,
            },
            summary:
                testExecutionIssueData.summary ??
                defaultSummary(new Date(runData.startedTestsAt).getTime()),
            description:
                testExecutionIssueData.description ??
                defaultDescription(
                    runData.cypressVersion,
                    runData.browserName,
                    runData.browserVersion
                ),
            issuetype: testExecutionIssueData.issuetype,
        },
        xrayFields: {
            testPlanKey: testExecutionIssueData.testPlan?.issueKey,
            environments: testExecutionIssueData.testEnvironments?.environments,
        },
    };
}

function defaultSummary(timestamp: number): string {
    return `Execution Results [${timestamp}]`;
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
