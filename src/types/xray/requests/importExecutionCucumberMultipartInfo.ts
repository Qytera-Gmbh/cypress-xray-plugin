import {
    IssueTypeDetailsCloud,
    IssueTypeDetailsServer,
} from "../../jira/responses/issueTypeDetails";
import { IssueUpdateCloud, IssueUpdateServer } from "../../jira/responses/issueUpdate";

type CucumberMultipartInfo<IssueTypeDetails, IssueUpdateType> = IssueUpdateType & {
    fields: {
        project: {
            key: string;
        };
        summary: string;
        description?: string;
        issuetype: IssueTypeDetails;
        labels?: string[];
    };
};
export type CucumberMultipartInfoServer = CucumberMultipartInfo<
    IssueTypeDetailsServer,
    IssueUpdateServer
>;
export type CucumberMultipartInfoCloud = CucumberMultipartInfo<
    IssueTypeDetailsCloud,
    IssueUpdateCloud
> & {
    xrayFields?: {
        testPlanKey?: string;
        environments?: string[];
    };
};
