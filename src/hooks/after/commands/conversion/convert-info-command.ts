import { IssueTypeDetails } from "../../../../types/jira/responses/issue-type-details";
import { IssueUpdate } from "../../../../types/jira/responses/issue-update";
import { InternalJiraOptions, InternalXrayOptions } from "../../../../types/plugin";
import { MultipartInfo } from "../../../../types/xray/requests/import-execution-multipart-info";
import { Logger } from "../../../../util/logging";
import { Command, Computable } from "../../../command";
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
        "projectKey" | "testExecutionIssueDescription" | "testPlanIssueKey"
    >;
    xray: Pick<InternalXrayOptions, "testEnvironments" | "uploadScreenshots">;
}

export abstract class ConvertInfoCommand extends Command<MultipartInfo, Parameters> {
    private readonly testExecutionIssueType: Computable<IssueTypeDetails>;
    private readonly runInformation: Computable<RunData>;
    private readonly info?: {
        custom?: Computable<IssueUpdate>;
        fieldIds?: {
            testEnvironmentsId?: Computable<string>;
            testPlanId?: Computable<string>;
        };
        summary?: Computable<string>;
    };

    constructor(
        parameters: Parameters,
        logger: Logger,
        testExecutionIssueType: Computable<IssueTypeDetails>,
        runInformation: Computable<RunData>,
        info?: {
            custom?: Computable<IssueUpdate>;
            fieldIds?: {
                testEnvironmentsId?: Computable<string>;
                testPlanId?: Computable<string>;
            };
            summary?: Computable<string>;
        }
    ) {
        super(parameters, logger);
        this.info = info;
        this.testExecutionIssueType = testExecutionIssueType;
        this.runInformation = runInformation;
    }

    protected async computeResult(): Promise<MultipartInfo> {
        const testExecutionIssueType = await this.testExecutionIssueType.compute();
        const runInformation = await this.runInformation.compute();
        const custom = await this.info?.custom?.compute();
        const summary = await this.info?.summary?.compute();
        const testExecutionIssueData: TestExecutionIssueDataServer = {
            custom: custom,
            description: this.parameters.jira.testExecutionIssueDescription,
            issuetype: testExecutionIssueType,
            projectKey: this.parameters.jira.projectKey,
            summary: summary,
        };
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
        ...[options, logger, testExecutionIssueType, runInformation, info]: ConstructorParameters<
            typeof ConvertInfoCommand
        >
    ) {
        super(options, logger, testExecutionIssueType, runInformation, info);
        if (this.parameters.jira.testPlanIssueKey && !info?.fieldIds?.testPlanId) {
            throw new Error(
                "A test plan issue key was supplied without the test plan Jira field ID"
            );
        }
        if (this.parameters.xray.testEnvironments && !info?.fieldIds?.testEnvironmentsId) {
            throw new Error(
                "Test environments were supplied without the test environments Jira field ID"
            );
        }
        this.testEnvironmentsId = info?.fieldIds?.testEnvironmentsId;
        this.testPlanId = info?.fieldIds?.testPlanId;
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
