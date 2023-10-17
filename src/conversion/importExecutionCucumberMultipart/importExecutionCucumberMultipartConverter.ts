import { SupportedField } from "../../repository/jira/fields/fetching";
import { JiraRepository } from "../../repository/jira/jiraRepository";
import { InternalOptions } from "../../types/plugin";
import {
    CucumberMultipart,
    CucumberMultipartFeature,
} from "../../types/xray/requests/importExecutionCucumberMultipart";
import {
    CucumberMultipartInfoCloud,
    CucumberMultipartInfoServer,
} from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { Converter } from "../converter";
import { getMultipartFeatures } from "./multipartFeatureConversion";
import {
    TestExecutionIssueData,
    TestExecutionIssueDataServer,
    getMultipartInfoCloud,
    getMultipartInfoServer,
} from "./multipartInfoConversion";

/**
 * This type provides lots of information which the converters require for results conversion. The
 * properties `runs` and `config` are excluded because in the scope of the converters, they have
 * been replaced with the Cucumber JSON and the plugin's options respectively.
 */
export type ConversionParameters = Omit<CypressCommandLine.CypressRunResult, "runs" | "config">;

type CucumberMultipartInfoType = CucumberMultipartInfoServer | CucumberMultipartInfoCloud;

export class ImportExecutionCucumberMultipartConverter extends Converter<
    CucumberMultipartFeature[],
    CucumberMultipart<CucumberMultipartInfoType>,
    ConversionParameters
> {
    /**
     * Whether the converter is a cloud converter. Useful for automatically deducing which test
     * converters to use.
     */
    private readonly isCloudConverter: boolean;
    private readonly jiraRepository: JiraRepository;

    /**
     * Construct a new converter with access to the provided options. The cloud converter flag is
     * used to deduce the output format. When set to `true`, Xray cloud JSONs will be created, if
     * set to `false`, the format will be Xray server JSON.
     *
     * @param options - the options
     * @param isCloudConverter - whether Xray cloud JSONs should be created
     * @param jiraRepository - the Jira repository for fetching issue data
     */
    constructor(
        options: InternalOptions,
        isCloudConverter: boolean,
        jiraRepository: JiraRepository
    ) {
        super(options);
        this.isCloudConverter = isCloudConverter;
        this.jiraRepository = jiraRepository;
    }

    public async convert(
        input: CucumberMultipartFeature[],
        parameters: ConversionParameters
    ): Promise<CucumberMultipart<CucumberMultipartInfoType>> {
        const features = getMultipartFeatures(input, {
            testExecutionIssueKey: this.options.jira.testExecutionIssueKey,
            includeScreenshots: this.options.xray.uploadScreenshots,
            projectKey: this.options.jira.projectKey,
            useCloudTags: this.isCloudConverter,
        });
        if (this.isCloudConverter) {
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
            return {
                features: features,
                info: getMultipartInfoCloud(parameters, testExecutionIssueData),
            };
        }
        const testExecutionIssueData: TestExecutionIssueDataServer = {
            projectKey: this.options.jira.projectKey,
            summary: this.options.jira.testExecutionIssueSummary,
            description: this.options.jira.testExecutionIssueDescription,
            issuetype: this.options.jira.testExecutionIssueDetails,
        };
        if (this.options.jira.testPlanIssueKey) {
            testExecutionIssueData.testPlan = {
                issueKey: this.options.jira.testPlanIssueKey,
                fieldId: await this.jiraRepository.getFieldId(SupportedField.TEST_PLAN, "testPlan"),
            };
        }
        if (this.options.xray.testEnvironments) {
            testExecutionIssueData.testEnvironments = {
                environments: this.options.xray.testEnvironments,
                fieldId: await this.jiraRepository.getFieldId(
                    SupportedField.TEST_ENVIRONMENTS,
                    "testEnvironments"
                ),
            };
        }
        return {
            features: features,
            info: getMultipartInfoServer(parameters, testExecutionIssueData),
        };
    }
}
