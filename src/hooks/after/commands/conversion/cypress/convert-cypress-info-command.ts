import { CypressRunResultType } from "../../../../../types/cypress/run-result";
import { InternalJiraOptions, InternalXrayOptions } from "../../../../../types/plugin";
import { XrayTestExecutionInfo } from "../../../../../types/xray/import-test-execution-results";
import { dedent } from "../../../../../util/dedent";
import { truncateIsoTime } from "../../../../../util/time";
import { Command, Computable } from "../../../../command";

interface Parameters {
    jira: Pick<
        InternalJiraOptions,
        | "projectKey"
        | "testExecutionIssueDescription"
        | "testExecutionIssueKey"
        | "testExecutionIssueSummary"
        | "testPlanIssueKey"
    >;
    xray: Pick<InternalXrayOptions, "testEnvironments">;
}

export class ConvertCypressInfoCommand extends Command<XrayTestExecutionInfo> {
    protected readonly parameters: Parameters;
    private readonly results: Computable<CypressRunResultType>;
    constructor(parameters: Parameters, results: Computable<CypressRunResultType>) {
        super();
        this.parameters = parameters;
        this.results = results;
    }

    public getParameters(): Parameters {
        return this.parameters;
    }

    protected async computeResult(): Promise<XrayTestExecutionInfo> {
        const results = await this.results.compute();
        return {
            project: this.parameters.jira.projectKey,
            startDate: truncateIsoTime(results.startedTestsAt),
            finishDate: truncateIsoTime(results.endedTestsAt),
            description: this.getDescription(results),
            summary: this.getTextExecutionResultSummary(results),
            testPlanKey: this.parameters.jira.testPlanIssueKey,
            testEnvironments: this.parameters.xray.testEnvironments,
        };
    }

    private getTextExecutionResultSummary(results: CypressRunResultType): string | undefined {
        // Don't replace existing execution summaries with the default one.
        if (
            this.parameters.jira.testExecutionIssueKey &&
            !this.parameters.jira.testExecutionIssueSummary
        ) {
            return undefined;
        }
        return (
            this.parameters.jira.testExecutionIssueSummary ??
            `Execution Results [${new Date(results.startedTestsAt).getTime()}]`
        );
    }

    private getDescription(results: CypressRunResultType): string | undefined {
        // Don't replace existing execution descriptions with the default one.
        if (
            this.parameters.jira.testExecutionIssueKey &&
            !this.parameters.jira.testExecutionIssueDescription
        ) {
            return undefined;
        }
        return (
            this.parameters.jira.testExecutionIssueDescription ??
            dedent(`
                Cypress version: ${results.cypressVersion}
                Browser: ${results.browserName} (${results.browserVersion})
            `)
        );
    }
}
