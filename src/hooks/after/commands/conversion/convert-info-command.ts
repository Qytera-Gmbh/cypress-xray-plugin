import { IssueTypeDetails } from "../../../../types/jira/responses/issue-type-details";
import {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalXrayOptions,
} from "../../../../types/plugin";
import { MultipartInfo } from "../../../../types/xray/requests/import-execution-multipart-info";
import { Logger } from "../../../../util/logging";
import { Command, Computable } from "../../../command";
import {
    RunData,
    TestExecutionIssueData,
    TestExecutionIssueDataServer,
    buildMultipartInfoCloud,
    buildMultipartInfoServer,
} from "./cucumber/util/multipart-info";

interface Parameters {
    cucumber?: Pick<InternalCucumberOptions, "prefixes">;
    jira: Pick<
        InternalJiraOptions,
        "projectKey" | "testExecutionIssueDescription" | "testPlanIssueKey"
    >;
    xray: Pick<InternalXrayOptions, "testEnvironments" | "uploadScreenshots">;
}

export abstract class ConvertInfoCommand extends Command<MultipartInfo, Parameters> {
    private readonly beginDateId?: Computable<string>;
    private readonly endDateId?: Computable<string>;
    private readonly testExecutionIssueType: Computable<IssueTypeDetails>;
    private readonly runInformation: Computable<RunData>;
    private readonly summary: Computable<string>;

    constructor(
        parameters: Parameters,
        logger: Logger,
        testExecutionIssueType: Computable<IssueTypeDetails>,
        runInformation: Computable<RunData>,
        summary: Computable<string>,
        fieldIds?: {
            beginDateId?: Computable<string>;
            endDateId?: Computable<string>;
            testEnvironmentsId?: Computable<string>;
            testPlanId?: Computable<string>;
        }
    ) {
        super(parameters, logger);
        this.beginDateId = fieldIds?.beginDateId;
        this.endDateId = fieldIds?.endDateId;
        this.testExecutionIssueType = testExecutionIssueType;
        this.runInformation = runInformation;
        this.summary = summary;
    }

    protected async computeResult(): Promise<MultipartInfo> {
        const testExecutionIssueType = await this.testExecutionIssueType.compute();
        const runInformation = await this.runInformation.compute();
        const summary = await this.summary.compute();
        const testExecutionIssueData: TestExecutionIssueDataServer = {
            description: this.parameters.jira.testExecutionIssueDescription,
            issuetype: testExecutionIssueType,
            projectKey: this.parameters.jira.projectKey,
            summary: summary,
        };
        if (this.beginDateId) {
            testExecutionIssueData.beginDate = {
                fieldId: await this.beginDateId.compute(),
                value: runInformation.startedTestsAt,
            };
        }
        if (this.endDateId) {
            testExecutionIssueData.beginDate = {
                fieldId: await this.endDateId.compute(),
                value: runInformation.endedTestsAt,
            };
        }
        return await this.buildInfo(runInformation, testExecutionIssueData);
    }

    protected abstract buildInfo(
        runInformation: RunData,
        testExecutionIssueData: TestExecutionIssueData
    ): MultipartInfo | Promise<MultipartInfo>;
}

export class ConvertInfoServerCommand extends ConvertInfoCommand {
    private readonly testEnvironmentsId?: Computable<string>;
    private readonly testPlanId?: Computable<string>;
    constructor(
        options: Parameters,
        logger: Logger,
        testExecutionIssueType: Computable<IssueTypeDetails>,
        runInformation: Computable<RunData>,
        summary: Computable<string>,
        fieldIds?: {
            beginDateId?: Computable<string>;
            endDateId?: Computable<string>;
            testEnvironmentsId?: Computable<string>;
            testPlanId?: Computable<string>;
        }
    ) {
        super(options, logger, testExecutionIssueType, runInformation, summary);
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
        this.testEnvironmentsId = fieldIds?.testEnvironmentsId;
        this.testPlanId = fieldIds?.testPlanId;
    }

    protected async buildInfo(
        runInformation: RunData,
        testExecutionIssueData: TestExecutionIssueDataServer
    ): Promise<MultipartInfo> {
        if (this.parameters.jira.testPlanIssueKey && this.testPlanId) {
            const testPlandId = await this.testPlanId.compute();
            testExecutionIssueData.testPlan = {
                fieldId: testPlandId,
                value: this.parameters.jira.testPlanIssueKey,
            };
        }
        if (this.parameters.xray.testEnvironments && this.testEnvironmentsId) {
            const testEnvironmentsId = await this.testEnvironmentsId.compute();
            testExecutionIssueData.testEnvironments = {
                fieldId: testEnvironmentsId,
                value: this.parameters.xray.testEnvironments,
            };
        }
        return buildMultipartInfoServer(runInformation, testExecutionIssueData);
    }
}

export class ConvertInfoCloudCommand extends ConvertInfoCommand {
    protected buildInfo(
        runInformation: RunData,
        testExecutionIssueData: TestExecutionIssueData
    ): MultipartInfo {
        if (this.parameters.jira.testPlanIssueKey) {
            testExecutionIssueData.testPlan = {
                value: this.parameters.jira.testPlanIssueKey,
            };
        }
        if (this.parameters.xray.testEnvironments) {
            testExecutionIssueData.testEnvironments = {
                value: this.parameters.xray.testEnvironments,
            };
        }
        return buildMultipartInfoCloud(runInformation, testExecutionIssueData);
    }
}
