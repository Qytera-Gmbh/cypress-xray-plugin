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
    duration: number;
    evidences: {
        author: string;
        authorFullName: string;
        created: string;
        createdDate: number;
        fileIcon: string;
        fileIconAlt: string;
        fileName: string;
        filePath: string;
        fileSize: string;
        ["fileURL"]: string;
        id: number;
        mimeType: string;
        numericalFileSize: number;
    }[];
    finishedOn: string;
    finishedOnIso: string;
    id: number;
    iterations: {
        color: string;
        id: number;
        parameters: [
            {
                name: string;
                value: string;
            },
        ];
        status: string;
    }[];
    startedOn: string;
    startedOnIso: string;
    status: string;
    testEnvironments: string[];
    testExecKey: string;
    testKey: string;
    testVersion: string;
}
