import type { IssueTypeDetails } from "../../../../types/jira/responses/issue-type-details";
import type { IssueUpdate } from "../../../../types/jira/responses/issue-update";
import type { InternalXrayOptions } from "../../../../types/plugin";
import type {
    MultipartInfo,
    MultipartInfoCloud,
} from "../../../../types/xray/requests/import-execution-multipart-info";
import { getOrCall } from "../../../../util/functions";
import type { Logger } from "../../../../util/logging";
import type { Computable } from "../../../command";
import { Command } from "../../../command";
import {
    type RunData,
    type TestExecutionIssueData,
    type TestExecutionIssueDataServer,
    buildMultipartInfoCloud,
    buildMultipartInfoServer,
} from "./util/multipart-info";

interface Parameters {
    jira: {
        projectKey: string;
        testPlanIssueKey?: string;
    };
    xray: Pick<InternalXrayOptions, "testEnvironments" | "uploadScreenshots">;
}

abstract class ConvertInfoCommand<InfoType extends MultipartInfo> extends Command<
    InfoType,
    Parameters
> {
    private readonly results: Computable<RunData>;
    private readonly summary: Computable<string>;
    private readonly issuetype: Computable<IssueTypeDetails>;
    private readonly issueUpdate?: Computable<IssueUpdate>;

    constructor(
        parameters: Parameters,
        logger: Logger,
        input: {
            issuetype: Computable<IssueTypeDetails>;
            issueUpdate?: Computable<IssueUpdate>;
            results: Computable<RunData>;
            summary: Computable<string>;
        }
    ) {
        super(parameters, logger);
        this.results = input.results;
        this.issueUpdate = input.issueUpdate;
        this.summary = input.summary;
        this.issuetype = input.issuetype;
    }

    protected async computeResult(): Promise<InfoType> {
        const runInformation = await this.results.compute();
        const issueUpdate = await this.issueUpdate?.compute();
        const testExecutionIssueData: TestExecutionIssueDataServer = {
            projectKey: this.parameters.jira.projectKey,
            testExecutionIssue: {
                fields: {
                    ...issueUpdate?.fields,
                    issuetype: await this.issuetype.compute(),
                    summary: await this.summary.compute(),
                },
                historyMetadata: issueUpdate?.historyMetadata,
                properties: issueUpdate?.properties,
                transition: issueUpdate?.transition,
                update: issueUpdate?.update,
            },
        };
        return await this.buildInfo(runInformation, testExecutionIssueData);
    }

    protected abstract buildInfo(
        runInformation: RunData,
        testExecutionIssueData: TestExecutionIssueData
    ): InfoType | Promise<InfoType>;
}

export class ConvertInfoServerCommand extends ConvertInfoCommand<MultipartInfo> {
    private readonly testEnvironmentsId?: Computable<string>;
    private readonly testPlanId?: Computable<string>;
    constructor(
        parameters: Parameters,
        logger: Logger,
        input: {
            fieldIds?: {
                testEnvironmentsId?: Computable<string>;
                testPlanId?: Computable<string>;
            };
            issuetype: Computable<IssueTypeDetails>;
            issueUpdate?: Computable<IssueUpdate>;
            results: Computable<RunData>;
            summary: Computable<string>;
        }
    ) {
        super(parameters, logger, input);
        if (this.parameters.jira.testPlanIssueKey && !input.fieldIds?.testPlanId) {
            throw new Error(
                "A test plan issue key was supplied without the test plan Jira field ID"
            );
        }
        if (this.parameters.xray.testEnvironments && !input.fieldIds?.testEnvironmentsId) {
            throw new Error(
                "Test environments were supplied without the test environments Jira field ID"
            );
        }
        this.testEnvironmentsId = input.fieldIds?.testEnvironmentsId;
        this.testPlanId = input.fieldIds?.testPlanId;
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

export class ConvertInfoCloudCommand extends ConvertInfoCommand<MultipartInfoCloud> {
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
