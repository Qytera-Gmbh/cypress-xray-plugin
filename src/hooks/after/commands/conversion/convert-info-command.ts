import { IssueTypeDetails } from "../../../../types/jira/responses/issue-type-details";
import { IssueUpdate } from "../../../../types/jira/responses/issue-update";
import { InternalJiraOptions, InternalXrayOptions } from "../../../../types/plugin";
import { MultipartInfo } from "../../../../types/xray/requests/import-execution-multipart-info";
import { getOrCall } from "../../../../util/functions";
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
    jira: Pick<InternalJiraOptions, "projectKey" | "testPlanIssueKey">;
    xray: Pick<InternalXrayOptions, "testEnvironments" | "uploadScreenshots">;
}

export abstract class ConvertInfoCommand extends Command<MultipartInfo, Parameters> {
    private readonly runInformation: Computable<RunData>;
    private readonly info: {
        issueData: Computable<IssueUpdate | undefined>;
        summary: Computable<string>;
        testExecutionIssueType: Computable<IssueTypeDetails>;
    };

    constructor(
        parameters: Parameters,
        logger: Logger,
        runInformation: Computable<RunData>,
        info: {
            issueData: Computable<IssueUpdate | undefined>;
            summary: Computable<string>;
            testExecutionIssueType: Computable<IssueTypeDetails>;
        }
    ) {
        super(parameters, logger);
        this.runInformation = runInformation;
        this.info = info;
    }

    protected async computeResult(): Promise<MultipartInfo> {
        const runInformation = await this.runInformation.compute();
        const issueData = await this.info.issueData.compute();
        const testExecutionIssueData: TestExecutionIssueDataServer = {
            projectKey: this.parameters.jira.projectKey,
            testExecutionIssue: {
                ...issueData,
                fields: {
                    ...issueData?.fields,
                    issuetype: await this.info.testExecutionIssueType.compute(),
                    summary: await this.info.summary.compute(),
                },
            },
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
        parameters: Parameters,
        logger: Logger,
        runInformation: Computable<RunData>,
        info: {
            fieldIds?: {
                testEnvironmentsId?: Computable<string>;
                testPlanId?: Computable<string>;
            };
            issueData: Computable<IssueUpdate | undefined>;
            summary: Computable<string>;
            testExecutionIssueType: Computable<IssueTypeDetails>;
        }
    ) {
        super(parameters, logger, runInformation, info);
        if (this.parameters.jira.testPlanIssueKey && !info.fieldIds?.testPlanId) {
            throw new Error(
                "A test plan issue key was supplied without the test plan Jira field ID"
            );
        }
        if (this.parameters.xray.testEnvironments && !info.fieldIds?.testEnvironmentsId) {
            throw new Error(
                "Test environments were supplied without the test environments Jira field ID"
            );
        }
        this.testEnvironmentsId = info.fieldIds?.testEnvironmentsId;
        this.testPlanId = info.fieldIds?.testPlanId;
    }

    protected async buildInfo(
        runInformation: RunData,
        testExecutionIssueData: TestExecutionIssueDataServer
    ): Promise<MultipartInfo> {
        if (this.parameters.jira.testPlanIssueKey && this.testPlanId) {
            const testPlandId = await this.testPlanId.compute();
            testExecutionIssueData.testPlan = {
                fieldId: testPlandId,
                value: await getOrCall(this.parameters.jira.testPlanIssueKey),
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
    protected async buildInfo(
        runInformation: RunData,
        testExecutionIssueData: TestExecutionIssueData
    ): Promise<MultipartInfo> {
        if (this.parameters.jira.testPlanIssueKey) {
            testExecutionIssueData.testPlan = {
                value: await getOrCall(this.parameters.jira.testPlanIssueKey),
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
