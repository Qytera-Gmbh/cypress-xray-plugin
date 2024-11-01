import type { CypressRunResultType } from "../../../../../types/cypress/cypress";
import type { IssueUpdate } from "../../../../../types/jira/responses/issue-update";
import type {
    MultipartInfo,
    MultipartInfoCloud,
} from "../../../../../types/xray/requests/import-execution-multipart-info";
import { dedent } from "../../../../../util/dedent";

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
    projectKey: string;
    testEnvironments?: {
        value: [string, ...string[]];
    };
    testExecutionIssue: IssueUpdate;
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
    const multipartInfo = getBaseInfo(runData, testExecutionIssueData);
    if (testExecutionIssueData.testPlan) {
        multipartInfo.fields[testExecutionIssueData.testPlan.fieldId] = [
            testExecutionIssueData.testPlan.value,
        ];
    }
    if (testExecutionIssueData.testEnvironments) {
        multipartInfo.fields[testExecutionIssueData.testEnvironments.fieldId] =
            testExecutionIssueData.testEnvironments.value;
    }
    multipartInfo.fields = {
        ...multipartInfo.fields,
        ...testExecutionIssueData.testExecutionIssue.fields,
    };
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
        ...getBaseInfo(runData, testExecutionIssueData),
        xrayFields: {
            environments: testExecutionIssueData.testEnvironments?.value,
            testPlanKey: testExecutionIssueData.testPlan?.value,
        },
    };
    multipartInfo.fields = {
        ...multipartInfo.fields,
        ...testExecutionIssueData.testExecutionIssue.fields,
    };
    return multipartInfo;
}

function getBaseInfo(
    runData: RunData,
    testExecutionIssueData: TestExecutionIssueData
): MultipartInfo {
    return {
        fields: {
            description:
                testExecutionIssueData.testExecutionIssue.fields?.description ??
                dedent(`
                    Cypress version: ${runData.cypressVersion}
                    Browser: ${runData.browserName} (${runData.browserVersion})
                `),
            issuetype: testExecutionIssueData.testExecutionIssue.fields?.issuetype,
            project: {
                key: testExecutionIssueData.projectKey,
            },
            summary: testExecutionIssueData.testExecutionIssue.fields?.summary,
        },
        historyMetadata: testExecutionIssueData.testExecutionIssue.historyMetadata,
        properties: testExecutionIssueData.testExecutionIssue.properties,
        transition: testExecutionIssueData.testExecutionIssue.transition,
        update: testExecutionIssueData.testExecutionIssue.update,
    };
}
