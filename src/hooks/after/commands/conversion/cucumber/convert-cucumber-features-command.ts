import {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalXrayOptions,
} from "../../../../../types/plugin";
import { CucumberMultipartFeature } from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import { Logger } from "../../../../../util/logging";
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
    cucumber: Pick<InternalCucumberOptions, "prefixes">;
    xray: Pick<InternalXrayOptions, "testEnvironments" | "uploadScreenshots">;
    projectRoot: string;
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
        logger: Logger,
        input: Computable<CucumberMultipartFeature[]>,
        testExecutionIssueKey?: Computable<string | undefined>
    ) {
        super(parameters, logger);
        this.input = input;
        this.testExecutionIssueKey = testExecutionIssueKey;
    }

    protected async computeResult(): Promise<CucumberMultipartFeature[]> {
        const input = await this.input.compute();
        const testExecutionIssueKey = await this.testExecutionIssueKey?.compute();
        return buildMultipartFeatures(
            input,
            {
                testExecutionIssueKey: testExecutionIssueKey,
                includeScreenshots: this.parameters.xray.uploadScreenshots,
                projectKey: this.parameters.jira.projectKey,
                useCloudTags: this.parameters.useCloudTags === true,
                testPrefix: this.parameters.cucumber.prefixes.test,
                projectRoot: this.parameters.projectRoot,
            },
            this.logger
        );
    }
}
