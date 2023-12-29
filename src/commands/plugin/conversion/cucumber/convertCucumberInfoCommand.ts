import { IssueTypeDetails } from "../../../../types/jira/responses/issueTypeDetails";
import {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalXrayOptions,
} from "../../../../types/plugin";
import { CucumberMultipartInfo } from "../../../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { Command, Computable } from "../../../command";
import {
    RunData,
    TestExecutionIssueData,
    TestExecutionIssueDataServer,
    buildMultipartInfoCloud,
    buildMultipartInfoServer,
} from "./util/multipartInfo";

interface Parameters {
    jira: Pick<
        InternalJiraOptions,
        | "projectKey"
        | "testExecutionIssueDescription"
        | "testExecutionIssueKey"
        | "testExecutionIssueSummary"
        | "testPlanIssueKey"
    >;
    cucumber?: Pick<InternalCucumberOptions, "prefixes">;
    xray: Pick<InternalXrayOptions, "testEnvironments" | "uploadScreenshots">;
}

export abstract class ConvertCucumberInfoCommand extends Command<CucumberMultipartInfo> {
    protected readonly parameters: Parameters;
    private readonly testExecutionIssueDetails: Computable<IssueTypeDetails>;
    private readonly runInformation: Computable<RunData>;
    constructor(
        parameters: Parameters,
        testExecutionIssueDetails: Computable<IssueTypeDetails>,
        runInformation: Computable<RunData>
    ) {
        super();
        this.parameters = parameters;
        this.testExecutionIssueDetails = testExecutionIssueDetails;
        this.runInformation = runInformation;
    }

    public getParameters(): Parameters {
        return this.parameters;
    }

    protected async computeResult(): Promise<CucumberMultipartInfo> {
        const testExecutionIssueDetails = await this.testExecutionIssueDetails.compute();
        const runInformation = await this.runInformation.compute();
        return await this.buildInfo(testExecutionIssueDetails, runInformation);
    }

    protected abstract buildInfo(
        testExecutionIssueDetails: IssueTypeDetails,
        runInformation: RunData
    ): CucumberMultipartInfo | Promise<CucumberMultipartInfo>;
}

export class ConvertCucumberInfoServerCommand extends ConvertCucumberInfoCommand {
    private readonly testPlanId?: Computable<string>;
    private readonly testEnvironmentsId?: Computable<string>;
    constructor(
        options: Parameters,
        testExecutionIssueDetails: Computable<IssueTypeDetails>,
        runInformation: Computable<RunData>,
        fieldIds?: {
            testPlanId?: Computable<string>;
            testEnvironmentsId?: Computable<string>;
        }
    ) {
        super(options, testExecutionIssueDetails, runInformation);
        if (this.parameters.jira.testPlanIssueKey && !fieldIds?.testPlanId) {
            throw new Error(
                "A test plan issue key was supplied without the test plan Jira field ID"
            );
        }
        if (this.parameters.xray.testEnvironments && !fieldIds?.testEnvironmentsId) {
            throw new Error(
                "Test environments were supplied without the test environments Jira field ID"
            );
        }
        this.testPlanId = fieldIds?.testPlanId;
        this.testEnvironmentsId = fieldIds?.testEnvironmentsId;
    }

    protected async buildInfo(
        testExecutionIssueDetails: IssueTypeDetails,
        runInformation: RunData
    ): Promise<CucumberMultipartInfo> {
        const testExecutionIssueData: TestExecutionIssueDataServer = {
            projectKey: this.parameters.jira.projectKey,
            summary: this.parameters.jira.testExecutionIssueSummary,
            description: this.parameters.jira.testExecutionIssueDescription,
            issuetype: testExecutionIssueDetails,
        };
        if (this.parameters.jira.testPlanIssueKey && this.testPlanId) {
            const testPlandId = await this.testPlanId.compute();
            testExecutionIssueData.testPlan = {
                issueKey: this.parameters.jira.testPlanIssueKey,
                fieldId: testPlandId,
            };
        }
        if (this.parameters.xray.testEnvironments && this.testEnvironmentsId) {
            const testEnvironmentsId = await this.testEnvironmentsId.compute();
            testExecutionIssueData.testEnvironments = {
                environments: this.parameters.xray.testEnvironments,
                fieldId: testEnvironmentsId,
            };
        }
        return buildMultipartInfoServer(runInformation, testExecutionIssueData);
    }
}

export class ConvertCucumberInfoCloudCommand extends ConvertCucumberInfoCommand {
    protected buildInfo(
        testExecutionIssueDetails: IssueTypeDetails,
        runInformation: RunData
    ): CucumberMultipartInfo {
        const testExecutionIssueData: TestExecutionIssueData = {
            projectKey: this.parameters.jira.projectKey,
            summary: this.parameters.jira.testExecutionIssueSummary,
            description: this.parameters.jira.testExecutionIssueDescription,
            issuetype: testExecutionIssueDetails,
        };
        if (this.parameters.jira.testPlanIssueKey) {
            testExecutionIssueData.testPlan = {
                issueKey: this.parameters.jira.testPlanIssueKey,
            };
        }
        if (this.parameters.xray.testEnvironments) {
            testExecutionIssueData.testEnvironments = {
                environments: this.parameters.xray.testEnvironments,
            };
        }
        return buildMultipartInfoCloud(runInformation, testExecutionIssueData);
    }
}
