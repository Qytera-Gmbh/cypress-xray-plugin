import { IssueTypeDetails } from "../../jira/responses/issue-type-details";
import { IssueUpdate } from "../../jira/responses/issue-update";

export interface CucumberMultipartInfo extends IssueUpdate {
    fields: {
        [k: string]: unknown;
        description?: string;
        issuetype: IssueTypeDetails;
        labels?: string[];
        project: {
            key: string;
        };
        summary: string;
    };
}
export interface CucumberMultipartInfoCloud extends CucumberMultipartInfo {
    xrayFields?: {
        environments?: string[];
        testPlanKey?: string;
    };
}
