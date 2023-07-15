import { CucumberMultipartInfoServer } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { ImportExecutionCucumberMultipartConverter } from "./importExecutionCucumberMultipartConverter";

export class ImportExecutionCucumberMultipartConverterServer extends ImportExecutionCucumberMultipartConverter<CucumberMultipartInfoServer> {
    protected getMultipartInfo(): CucumberMultipartInfoServer {
        const info: CucumberMultipartInfoServer = {
            fields: {
                project: {
                    key: this.options.jira.projectKey,
                },
                summary: this.options.jira.testExecutionIssueSummary,
                issuetype: this.options.jira.testExecutionIssueDetails,
            },
        };
        info[this.options.jira.testPlanIssueDetails.id] = [this.options.jira.testPlanIssueKey];
        return info;
    }
}
