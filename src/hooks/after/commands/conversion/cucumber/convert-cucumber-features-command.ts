import {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalXrayOptions,
} from "../../../../../types/plugin";
import { CucumberMultipartFeature } from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import { Command, Computable } from "../../../../command";
import { buildMultipartFeatures } from "./util/multipart-feature";

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

export class ConvertCucumberFeaturesCommand extends Command<
    CucumberMultipartFeature[],
    Parameters
> {
    private readonly input: Computable<CucumberMultipartFeature[]>;
    private readonly testExecutionIssueKey?: Computable<string>;
    constructor(
        parameters: Parameters,
        input: Computable<CucumberMultipartFeature[]>,
        testExecutionIssueKey?: Computable<string>
    ) {
        super(parameters);
        this.input = input;
        this.testExecutionIssueKey = testExecutionIssueKey;
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
