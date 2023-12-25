import { buildMultipartFeatures } from "../../../conversion/importExecutionCucumberMultipart/multipartFeatureBuilder";
import {
    RunData,
    TestExecutionIssueData,
    TestExecutionIssueDataServer,
    buildMultipartInfoCloud,
    buildMultipartInfoServer,
} from "../../../conversion/importExecutionCucumberMultipart/multipartInfoBuilder";
import {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalXrayOptions,
} from "../../../types/plugin";
import {
    CucumberMultipart,
    CucumberMultipartFeature,
} from "../../../types/xray/requests/importExecutionCucumberMultipart";
import { CucumberMultipartInfo } from "../../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { Command, Computable } from "../../../util/command/command";

interface Parameters {
    jira: Pick<
        InternalJiraOptions,
        | "projectKey"
        | "testExecutionIssueDescription"
        | "testExecutionIssueDetails"
        | "testExecutionIssueKey"
        | "testExecutionIssueSummary"
        | "testPlanIssueKey"
    >;
    cucumber?: Pick<InternalCucumberOptions, "prefixes">;
    xray: Pick<InternalXrayOptions, "testEnvironments" | "uploadScreenshots">;
}

export abstract class ConvertCucumberMultipartCommand extends Command<CucumberMultipart> {
    protected readonly options: Parameters;
    private readonly input: Computable<CucumberMultipartFeature[]>;
    private readonly runInformation: Computable<RunData>;
    constructor(
        options: Parameters,
        input: Computable<CucumberMultipartFeature[]>,
        runInformation: Computable<RunData>
    ) {
        super();
        this.options = options;
        this.input = input;
        this.runInformation = runInformation;
    }

    protected async computeResult(): Promise<CucumberMultipart> {
        const input = await this.input.getResult();
        const runInformation = await this.runInformation.getResult();
        return {
            features: await this.modifyFeatures(input),
            info: await this.buildInfo(runInformation),
        };
    }

    protected abstract modifyFeatures(
        input: CucumberMultipartFeature[]
    ): CucumberMultipartFeature[] | Promise<CucumberMultipartFeature[]>;

    protected abstract buildInfo(
        runInformation: RunData
    ): CucumberMultipartInfo | Promise<CucumberMultipartInfo>;
}

export class ConvertCucumberMultipartServerCommand extends ConvertCucumberMultipartCommand {
    private readonly testPlanId?: Computable<string>;
    private readonly testEnvironmentsId?: Computable<string>;
    constructor(
        options: Parameters,
        input: Computable<CucumberMultipartFeature[]>,
        runInformation: Computable<RunData>,
        testPlanId?: Computable<string>,
        testEnvironmentsId?: Computable<string>
    ) {
        super(options, input, runInformation);
        if (this.options.jira.testPlanIssueKey && !testPlanId) {
            throw new Error("A test plan key was supplied without the test plan Jira field ID");
        }
        if (this.options.xray.testEnvironments && !testEnvironmentsId) {
            throw new Error(
                "Test environments were supplied without the test environments Jira field ID"
            );
        }
    }

    protected modifyFeatures(input: CucumberMultipartFeature[]): CucumberMultipartFeature[] {
        return buildMultipartFeatures(input, {
            testExecutionIssueKey: this.options.jira.testExecutionIssueKey,
            includeScreenshots: this.options.xray.uploadScreenshots,
            projectKey: this.options.jira.projectKey,
            useCloudTags: false,
            testPrefix: this.options.cucumber?.prefixes.test,
        });
    }

    protected async buildInfo(runInformation: RunData): Promise<CucumberMultipartInfo> {
        const testExecutionIssueData: TestExecutionIssueDataServer = {
            projectKey: this.options.jira.projectKey,
            summary: this.options.jira.testExecutionIssueSummary,
            description: this.options.jira.testExecutionIssueDescription,
            issuetype: this.options.jira.testExecutionIssueDetails,
        };
        if (this.options.jira.testPlanIssueKey && this.testPlanId) {
            const testPlandId = await this.testPlanId.getResult();
            testExecutionIssueData.testPlan = {
                issueKey: this.options.jira.testPlanIssueKey,
                fieldId: testPlandId,
            };
        }
        if (this.options.xray.testEnvironments && this.testEnvironmentsId) {
            const testEnvironmentsId = await this.testEnvironmentsId.getResult();
            testExecutionIssueData.testEnvironments = {
                environments: this.options.xray.testEnvironments,
                fieldId: testEnvironmentsId,
            };
        }
        return buildMultipartInfoServer(runInformation, testExecutionIssueData);
    }
}

export class ConvertCucumberMultipartCloudCommand extends ConvertCucumberMultipartCommand {
    protected modifyFeatures(input: CucumberMultipartFeature[]): CucumberMultipartFeature[] {
        return buildMultipartFeatures(input, {
            testExecutionIssueKey: this.options.jira.testExecutionIssueKey,
            includeScreenshots: this.options.xray.uploadScreenshots,
            projectKey: this.options.jira.projectKey,
            useCloudTags: true,
            testPrefix: this.options.cucumber?.prefixes.test,
        });
    }

    protected buildInfo(runInformation: RunData): CucumberMultipartInfo {
        const testExecutionIssueData: TestExecutionIssueData = {
            projectKey: this.options.jira.projectKey,
            summary: this.options.jira.testExecutionIssueSummary,
            description: this.options.jira.testExecutionIssueDescription,
            issuetype: this.options.jira.testExecutionIssueDetails,
        };
        if (this.options.jira.testPlanIssueKey) {
            testExecutionIssueData.testPlan = {
                issueKey: this.options.jira.testPlanIssueKey,
            };
        }
        if (this.options.xray.testEnvironments) {
            testExecutionIssueData.testEnvironments = {
                environments: this.options.xray.testEnvironments,
            };
        }
        return buildMultipartInfoCloud(runInformation, testExecutionIssueData);
    }
}
