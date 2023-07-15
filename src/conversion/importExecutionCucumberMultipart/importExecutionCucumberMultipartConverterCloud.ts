import { CucumberMultipartTag } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { CucumberMultipartInfoCloud } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { ImportExecutionCucumberMultipartConverter } from "./importExecutionCucumberMultipartConverter";

export class ImportExecutionCucumberMultipartConverterCloud extends ImportExecutionCucumberMultipartConverter<CucumberMultipartInfoCloud> {
    protected getMultipartInfo(): CucumberMultipartInfoCloud {
        const info: CucumberMultipartInfoCloud = {
            fields: {
                project: {
                    key: this.options.jira.projectKey,
                },
                summary:
                    this.options.jira.testExecutionIssueSummary ||
                    `Execution Results [${new Date(this.startedTestsAt).getTime()}]`,
                issuetype: this.options.jira.testExecutionIssueDetails,
            },
            xrayFields: {},
        };
        if (this.options.jira.testPlanIssueKey) {
            info.xrayFields.testPlanKey = this.options.jira.testPlanIssueKey;
        }
        return info;
    }

    protected containsTestTag(tags: CucumberMultipartTag[]): boolean {
        return tags.some((tag: CucumberMultipartTag) => {
            const regex = new RegExp(`@TestName:${this.options.jira.projectKey}-\\d+`);
            return regex.test(tag.name);
        });
    }
}
