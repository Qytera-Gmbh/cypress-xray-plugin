import { JiraRepositoryServer } from "../../repository/jira/jiraRepositoryServer";
import { InternalOptions } from "../../types/plugin";
import { CucumberMultipartInfoServer } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import {
    ConversionParameters,
    ImportExecutionCucumberMultipartConverter,
} from "./importExecutionCucumberMultipartConverter";

export class ImportExecutionCucumberMultipartConverterServer extends ImportExecutionCucumberMultipartConverter<CucumberMultipartInfoServer> {
    private readonly jiraRepository: JiraRepositoryServer;

    constructor(options: InternalOptions, jiraRepository: JiraRepositoryServer) {
        super(options);
        this.jiraRepository = jiraRepository;
    }

    protected async getMultipartInfo(
        parameters: ConversionParameters
    ): Promise<CucumberMultipartInfoServer> {
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
            const testPlanFieldId = await this.jiraRepository.getFieldId(
                this.options.jira.testPlanIssueType
            );
            info.fields[testPlanFieldId] = [this.options.jira.testPlanIssueKey];
        }
        return info;
    }
}
