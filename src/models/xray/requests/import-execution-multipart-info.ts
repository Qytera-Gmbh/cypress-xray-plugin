import type { IssueUpdate } from "../../jira/responses/issue-update";

export interface MultipartInfo extends IssueUpdate {
    fields: {
        [customfield: string]: unknown;
        project: {
            key: string;
        };
    };
}
export interface MultipartInfoCloud extends MultipartInfo {
    xrayFields?: {
        environments?: readonly string[];
        testPlanKey?: string;
    };
}
