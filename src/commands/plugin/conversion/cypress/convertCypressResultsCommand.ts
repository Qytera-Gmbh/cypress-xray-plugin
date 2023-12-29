import { InternalJiraOptions, InternalXrayOptions } from "../../../../types/plugin";
import {
    XrayTest,
    XrayTestExecutionResults,
} from "../../../../types/xray/importTestExecutionResults";
import { dedent } from "../../../../util/dedent";
import { truncateIsoTime } from "../../../../util/time";
import { Command, Computable } from "../../../command";
import { CypressRunResultType } from "./util/importExecutionConverter";

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

export class ConvertCypressResultsCommand extends Command<XrayTestExecutionResults> {
    protected readonly parameters: Parameters;
    private readonly results: Computable<CypressRunResultType>;
    private readonly tests: Computable<[XrayTest, ...XrayTest[]]>;
    constructor(
        parameters: Parameters,
        results: Computable<CypressRunResultType>,
        tests: Computable<[XrayTest, ...XrayTest[]]>
    ) {
        super();
        this.parameters = parameters;
        this.results = results;
        this.tests = tests;
    }

    public getParameters(): Parameters {
        return this.parameters;
    }

    protected async computeResult(): Promise<XrayTestExecutionResults> {
        const results = await this.results.compute();
        const tests = await this.tests.compute();
        return {
            testExecutionKey: this.parameters.jira.testExecutionIssueKey,
            info: {
                project: this.parameters.jira.projectKey,
                startDate: truncateIsoTime(results.startedTestsAt),
                finishDate: truncateIsoTime(results.endedTestsAt),
                description: this.getDescription(results),
                summary: this.getTextExecutionResultSummary(results),
                testPlanKey: this.parameters.jira.testPlanIssueKey,
                testEnvironments: this.parameters.xray.testEnvironments,
            },
            tests: tests,
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
