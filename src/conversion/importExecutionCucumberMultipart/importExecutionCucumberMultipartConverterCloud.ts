import { CucumberMultipartInfoCloud } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { ImportExecutionCucumberMultipartConverter } from "./importExecutionCucumberMultipartConverter";

export class ImportExecutionCucumberMultipartConverterCloud extends ImportExecutionCucumberMultipartConverter<CucumberMultipartInfoCloud> {
    protected getMultipartInfo(): CucumberMultipartInfoCloud {
        return {
            fields: {
                project: {
                    key: this.options.jira.projectKey,
                },
                summary: this.options.jira.testExecutionIssueSummary,
                issuetype: this.options.jira.testExecutionIssueDetails,
            },
            xrayFields: {
                testPlanKey: this.options.jira.testPlanIssueKey,
            },
        };
    }
}
