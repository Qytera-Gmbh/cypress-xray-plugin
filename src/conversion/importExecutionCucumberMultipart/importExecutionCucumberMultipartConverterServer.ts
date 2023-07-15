import { CucumberMultipartTag } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { CucumberMultipartInfoServer } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { ImportExecutionCucumberMultipartConverter } from "./importExecutionCucumberMultipartConverter";

export class ImportExecutionCucumberMultipartConverterServer extends ImportExecutionCucumberMultipartConverter<CucumberMultipartInfoServer> {
    protected getMultipartInfo(): CucumberMultipartInfoServer {
        const info: CucumberMultipartInfoServer = {
            fields: {
                project: {
                    key: this.options.jira.projectKey,
                },
                summary:
                    this.options.jira.testExecutionIssueSummary ||
                    `Execution Results [${new Date(this.startedTestsAt).getTime()}]`,
                issuetype: this.options.jira.testExecutionIssueDetails,
            },
        };
        if (this.options.jira.testPlanIssueKey) {
            info.fields[this.options.jira.testPlanIssueDetails.id] = [
                this.options.jira.testPlanIssueKey,
            ];
        }
        return info;
    }

    protected containsTestTag(tags: CucumberMultipartTag[]): boolean {
        return tags.some((tag: CucumberMultipartTag) => {
            const regex = new RegExp(`@${this.options.jira.projectKey}-\\d+`);
            return regex.test(tag.name);
        });
    }
}
