import { IssueTypeDetails } from "../../../../types/jira/responses/issue-type-details";
import { IssueUpdate } from "../../../../types/jira/responses/issue-update";
import { InternalXrayOptions } from "../../../../types/plugin";
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
    jira: {
        projectKey: string;
        testPlanIssueKey?: string;
    };
    xray: Pick<InternalXrayOptions, "testEnvironments" | "uploadScreenshots">;
}

export type ComputedIssueUpdate = IssueUpdate & {
    computedFields: {
        issuetype: Computable<IssueTypeDetails>;
        summary: Computable<string>;
    };
};

export abstract class ConvertInfoCommand extends Command<MultipartInfo, Parameters> {
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

    protected async computeResult(): Promise<MultipartInfo> {
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
    ): MultipartInfo | Promise<MultipartInfo>;
}

export class ConvertInfoServerCommand extends ConvertInfoCommand {
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
