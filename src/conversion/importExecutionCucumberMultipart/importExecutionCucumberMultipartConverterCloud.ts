import { CucumberMultipartInfoCloud } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import {
    ConversionParameters,
    ImportExecutionCucumberMultipartConverter,
} from "./importExecutionCucumberMultipartConverter";

export class ImportExecutionCucumberMultipartConverterCloud extends ImportExecutionCucumberMultipartConverter<CucumberMultipartInfoCloud> {
    protected getMultipartInfo(parameters: ConversionParameters): CucumberMultipartInfoCloud {
        const summary =
            this.options.jira.testExecutionIssueSummary ||
            `Execution Results [${new Date(parameters.startedTestsAt).getTime()}]`;
        const description =
            this.options.jira.testExecutionIssueDescription ||
            "Cypress version: " +
                parameters.cypressVersion +
                " Browser: " +
                parameters.browserName +
                " (" +
                parameters.browserVersion +
                ")";
        const info: CucumberMultipartInfoCloud = {
            fields: {
                project: {
                    key: this.options.jira.projectKey,
                },
                summary: summary,
                description: description,
                issuetype: this.options.jira.testExecutionIssueDetails,
            },
            xrayFields: {},
        };
        if (this.options.jira.testPlanIssueKey) {
            info.xrayFields.testPlanKey = this.options.jira.testPlanIssueKey;
        }
        return info;
    }
}
