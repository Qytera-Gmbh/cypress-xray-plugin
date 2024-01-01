import {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalXrayOptions,
} from "../../../../../types/plugin";
import { CucumberMultipartFeature } from "../../../../../types/xray/requests/importExecutionCucumberMultipart";
import { Command, Computable } from "../../../../command";
import { buildMultipartFeatures } from "./util/multipartFeature";

interface Parameters {
    jira: Pick<
        InternalJiraOptions,
        | "projectKey"
        | "testExecutionIssueDescription"
        | "testExecutionIssueSummary"
        | "testPlanIssueKey"
    >;
    cucumber?: Pick<InternalCucumberOptions, "prefixes">;
    xray: Pick<InternalXrayOptions, "testEnvironments" | "uploadScreenshots">;
    useCloudTags?: boolean;
}

export class ConvertCucumberFeaturesCommand extends Command<CucumberMultipartFeature[]> {
    protected readonly parameters: Parameters;
    private readonly input: Computable<CucumberMultipartFeature[]>;
    private readonly testExecutionIssueKey?: Computable<string>;
    constructor(
        parameters: Parameters,
        input: Computable<CucumberMultipartFeature[]>,
        testExecutionIssueKey?: Computable<string>
    ) {
        super();
        this.parameters = parameters;
        this.input = input;
        this.testExecutionIssueKey = testExecutionIssueKey;
    }

    public getParameters(): Parameters {
        return this.parameters;
    }

    protected async computeResult(): Promise<CucumberMultipartFeature[]> {
        const input = await this.input.compute();
        const testExecutionIssueKey = await this.testExecutionIssueKey?.compute();
        return buildMultipartFeatures(input, {
            testExecutionIssueKey: testExecutionIssueKey,
            includeScreenshots: this.parameters.xray.uploadScreenshots,
            projectKey: this.parameters.jira.projectKey,
            useCloudTags: this.parameters.useCloudTags === true,
            testPrefix: this.parameters.cucumber?.prefixes.test,
        });
    }
}
