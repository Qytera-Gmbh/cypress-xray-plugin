import { CucumberMultipartInfoServer } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import {
    ConversionParameters,
    ImportExecutionCucumberMultipartConverter,
} from "./importExecutionCucumberMultipartConverter";

export class ImportExecutionCucumberMultipartConverterServer extends ImportExecutionCucumberMultipartConverter<CucumberMultipartInfoServer> {
    protected getMultipartInfo(parameters: ConversionParameters): CucumberMultipartInfoServer {
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
        const info: CucumberMultipartInfoServer = {
            fields: {
                project: {
                    key: this.options.jira.projectKey,
                },
                summary: summary,
                description: description,
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
}
