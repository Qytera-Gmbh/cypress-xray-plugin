import type { TestExecution } from "./xray";

/**
 * @see https://us.xray.cloud.getxray.app/doc/graphql/gettestruns.doc.html
 */
export interface GetTestRunsResponseCloud<JiraDataType> {
    data: {
        getTestRuns: TestExecution<JiraDataType>["testRuns"];
    };
}

/**
 * @see https://docs.getxray.app/display/XRAY/Test+Runs+-+REST
 */
export interface GetTestRunResponseServer {
    archived: false;
    assignee: string;
    color: string;
    customFields: [];
    defects: [];
    duration: number;
    evidences: [];
    finishedOn: string;
    finishedOnIso: string;
    fixVersions: [];
    id: number;
    iterations: [
        {
            color: string;
            id: number;
            parameters: [
                {
                    name: string;
                    value: string;
                },
            ];
            status: string;
        }[],
    ];
    startedOn: string;
    startedOnIso: string;
    status: string;
    testEnvironments: string[];
    testExecKey: string;
    testKey: string;
    testVersion: string;
}
