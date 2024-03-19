import { IssueTypeDetails } from "../../jira/responses/issue-type-details";
import { IssueUpdate } from "../../jira/responses/issue-update";

export interface CucumberMultipartInfo extends IssueUpdate {
    fields: {
        [k: string]: unknown;
        project: {
            key: string;
        };
        summary: string;
        description?: string;
        issuetype: IssueTypeDetails;
        labels?: string[];
    };
}
export interface CucumberMultipartInfoCloud extends CucumberMultipartInfo {
    xrayFields?: {
        testPlanKey?: string;
        environments?: string[];
    };
}
