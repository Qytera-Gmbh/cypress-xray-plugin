/* eslint-disable @typescript-eslint/naming-convention */
import type { TestExecution } from "./xray";

/**
 * @see https://us.xray.cloud.getxray.app/doc/graphql/gettestexecution.doc.html
 */
export interface GetTestExecutionResponseCloud<JiraDataType> {
    data: {
        getTestExecution: Pick<TestExecution<JiraDataType>, "tests">;
    };
}

/**
 * @see https://docs.getxray.app/display/XRAY/Test+Executions+-+REST
 */
export type GetTestExecutionResponseServer = {
    archived: boolean;
    assignee?: string;
    defects?: {
        id: number;
        key: string;
        status: string;
        summary: string;
    }[];
    evidences?: {
        author: string;
        created: string;
        fileName: string;
        fileSize: string;
        fileURL: string;
        id: number;
    }[];
    executedBy?: string;
    finishedOn?: string;
    id: number;
    key: string;
    rank: number;
    startedOn?: string;
    status: string;
}[];
