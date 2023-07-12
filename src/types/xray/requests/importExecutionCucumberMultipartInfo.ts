import { IssueUpdateCloud, IssueUpdateServer } from "../../jira/responses/issueUpdate";

export type CucumberMultipartInfoServer = IssueUpdateServer;
export type CucumberMultipartInfoCloud = IssueUpdateCloud & {
    xrayFields: {
        testPlanKey?: string;
        environments?: string[];
    };
};
