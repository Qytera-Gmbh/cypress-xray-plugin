import { IssueTypeDetails } from "../../jira/responses/issue-type-details";
import { IssueUpdate } from "../../jira/responses/issue-update";

export interface MultipartInfo extends IssueUpdate {
    fields: {
        [customfield: string]: unknown;
        description?: string;
        issuetype: IssueTypeDetails;
        labels?: string[];
        project: {
            key: string;
        };
        summary: string;
    };
}
export interface MultipartInfoCloud extends MultipartInfo {
    xrayFields?: {
        environments?: string[];
        testPlanKey?: string;
    };
}
