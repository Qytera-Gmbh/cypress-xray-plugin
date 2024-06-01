import { IssueTypeDetails } from "../../../../../types/jira/responses/issue-type-details";
import {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalXrayOptions,
} from "../../../../../types/plugin";
import { CucumberMultipartInfo } from "../../../../../types/xray/requests/import-execution-cucumber-multipart-info";
import { Logger } from "../../../../../util/logging";
import { Command, Computable } from "../../../../command";
import {
    RunData,
    TestExecutionIssueData,
    TestExecutionIssueDataServer,
    buildMultipartInfoCloud,
    buildMultipartInfoServer,
} from "./util/multipart-info";

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

export abstract class ConvertCucumberInfoCommand extends Command<
    CucumberMultipartInfo,
    Parameters
> {
    private readonly testExecutionIssueType: Computable<IssueTypeDetails>;
    private readonly runInformation: Computable<RunData>;
    constructor(
        parameters: Parameters,
        logger: Logger,
        testExecutionIssueType: Computable<IssueTypeDetails>,
        runInformation: Computable<RunData>
    ) {
        super(parameters, logger);
        this.testExecutionIssueType = testExecutionIssueType;
        this.runInformation = runInformation;
    }

    protected async computeResult(): Promise<CucumberMultipartInfo> {
        const testExecutionIssueType = await this.testExecutionIssueType.compute();
        const runInformation = await this.runInformation.compute();
        return await this.buildInfo(testExecutionIssueType, runInformation);
    }

    protected abstract buildInfo(
        testExecutionIssueType: IssueTypeDetails,
        runInformation: RunData
    ): CucumberMultipartInfo | Promise<CucumberMultipartInfo>;
}

export class ConvertCucumberInfoServerCommand extends ConvertCucumberInfoCommand {
    private readonly testPlanId?: Computable<string>;
    private readonly testEnvironmentsId?: Computable<string>;
    constructor(
        options: Parameters,
        logger: Logger,
        testExecutionIssueType: Computable<IssueTypeDetails>,
        runInformation: Computable<RunData>,
        fieldIds?: {
            testPlanId?: Computable<string>;
            testEnvironmentsId?: Computable<string>;
        }
    ) {
        super(options, logger, testExecutionIssueType, runInformation);
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
        testExecutionIssueType: IssueTypeDetails,
        runInformation: RunData
    ): Promise<CucumberMultipartInfo> {
        const testExecutionIssueData: TestExecutionIssueDataServer = {
            projectKey: this.parameters.jira.projectKey,
            summary: this.parameters.jira.testExecutionIssueSummary,
            description: this.parameters.jira.testExecutionIssueDescription,
            issuetype: testExecutionIssueType,
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
        testExecutionIssueType: IssueTypeDetails,
        runInformation: RunData
    ): CucumberMultipartInfo {
        const testExecutionIssueData: TestExecutionIssueData = {
            projectKey: this.parameters.jira.projectKey,
            summary: this.parameters.jira.testExecutionIssueSummary,
            description: this.parameters.jira.testExecutionIssueDescription,
            issuetype: testExecutionIssueType,
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
