import { IIssueTypeDetails } from "../../jira/responses/issueTypeDetails";
import { IIssueUpdate } from "../../jira/responses/issueUpdate";

export interface ICucumberMultipartInfo extends IIssueUpdate {
    fields: {
        project: {
            key: string;
        };
        summary: string;
        description?: string;
        issuetype: IIssueTypeDetails;
        labels?: string[];
        [k: string]: unknown;
    };
}
export interface CucumberMultipartInfoCloud extends ICucumberMultipartInfo {
    xrayFields?: {
        testPlanKey?: string;
        environments?: string[];
    };
}
