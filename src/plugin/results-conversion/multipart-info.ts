import type { CypressRunResult } from "../../models/cypress";
import type { IssueUpdate } from "../../models/jira/responses/issue-update";
import type {
    MultipartInfo,
    MultipartInfoCloud,
} from "../../models/xray/requests/import-execution-multipart-info";
import { dedent } from "../../util/dedent";

/**
 * Interface containing general/minimal Cypress run data.
 */
export type RunData = Pick<
    CypressRunResult,
    "browserName" | "browserVersion" | "cypressVersion" | "endedTestsAt" | "startedTestsAt"
>;

/**
 * Additional information used by test execution issues when uploading Cucumber results.
 */
export interface TestExecutionIssueData {
    projectKey: string;
    testEnvironments?: {
        value: readonly [string, ...string[]];
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
        value: readonly [string, ...string[]];
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
 * @param parameters - Cypress run data and test execution information to consider
 * @returns the Cucumber multipart information data for Xray server
 */
export function buildMultipartInfoServer(parameters: {
    browserName: string;
    browserVersion: string;
    cypressVersion: string;
    testExecutionIssueData: TestExecutionIssueDataServer;
}): MultipartInfo {
    const multipartInfo = getBaseInfo({
        browserName: parameters.browserName,
        browserVersion: parameters.browserVersion,
        cypressVersion: parameters.cypressVersion,
        testExecutionIssueData: parameters.testExecutionIssueData,
    });
    if (parameters.testExecutionIssueData.testPlan) {
        multipartInfo.fields[parameters.testExecutionIssueData.testPlan.fieldId] = [
            parameters.testExecutionIssueData.testPlan.value,
        ];
    }
    if (parameters.testExecutionIssueData.testEnvironments) {
        multipartInfo.fields[parameters.testExecutionIssueData.testEnvironments.fieldId] =
            parameters.testExecutionIssueData.testEnvironments.value;
    }
    multipartInfo.fields = {
        ...multipartInfo.fields,
        ...parameters.testExecutionIssueData.testExecutionIssue.fields,
    };
    return multipartInfo;
}

/**
 * Converts Cypress run data into Cucumber multipart information, which could be used when creating
 * new test executions on import or when updating existing ones.
 *
 * @param parameters - Cypress run data and test execution information to consider
 * @returns the Cucumber multipart information data for Xray cloud
 */
export function buildMultipartInfoCloud(parameters: {
    browserName: string;
    browserVersion: string;
    cypressVersion: string;
    testExecutionIssueData: TestExecutionIssueData;
}): MultipartInfoCloud {
    const multipartInfo: MultipartInfoCloud = {
        ...getBaseInfo({
            browserName: parameters.browserName,
            browserVersion: parameters.browserVersion,
            cypressVersion: parameters.cypressVersion,
            testExecutionIssueData: parameters.testExecutionIssueData,
        }),
        xrayFields: {
            environments: parameters.testExecutionIssueData.testEnvironments?.value,
            testPlanKey: parameters.testExecutionIssueData.testPlan?.value,
        },
    };
    multipartInfo.fields = {
        ...multipartInfo.fields,
        ...parameters.testExecutionIssueData.testExecutionIssue.fields,
    };
    return multipartInfo;
}

function getBaseInfo(parameters: {
    browserName: string;
    browserVersion: string;
    cypressVersion: string;
    testExecutionIssueData: TestExecutionIssueData;
}): MultipartInfo {
    return {
        fields: {
            description:
                parameters.testExecutionIssueData.testExecutionIssue.fields?.description ??
                dedent(`
                    Cypress version: ${parameters.cypressVersion}
                    Browser: ${parameters.browserName} (${parameters.browserVersion})
                `),
            issuetype: parameters.testExecutionIssueData.testExecutionIssue.fields?.issuetype,
            project: {
                key: parameters.testExecutionIssueData.projectKey,
            },
            summary: parameters.testExecutionIssueData.testExecutionIssue.fields?.summary,
        },
        historyMetadata: parameters.testExecutionIssueData.testExecutionIssue.historyMetadata,
        properties: parameters.testExecutionIssueData.testExecutionIssue.properties,
        transition: parameters.testExecutionIssueData.testExecutionIssue.transition,
        update: parameters.testExecutionIssueData.testExecutionIssue.update,
    };
}
