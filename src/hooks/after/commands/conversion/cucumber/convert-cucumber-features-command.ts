import {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalXrayOptions,
} from "../../../../../types/plugin";
import { CucumberMultipartFeature } from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import { Command, CommandDescription, Computable } from "../../../../command";
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
    private readonly testExecutionIssueKey?: Computable<string | undefined>;
    constructor(
        parameters: Parameters,
        input: Computable<CucumberMultipartFeature[]>,
        testExecutionIssueKey?: Computable<string | undefined>
    ) {
        super(parameters);
        this.input = input;
        this.testExecutionIssueKey = testExecutionIssueKey;
    }

    public getDescription(): CommandDescription {
        return {
            description:
                "Modifies Cucumber reports by adding test execution issue tags and filtering screenshots, based on the plugin options provided. The command also asserts that every scenario contained within the report has been appropriately tagged with either Xray cloud or Xray server tags and discards untagged ones.",
            runtimeInputs: ["the Cucumber report", "the test execution issue key"],
        };
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
