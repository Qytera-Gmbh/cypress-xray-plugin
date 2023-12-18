import { SupportedFields } from "../../repository/jira/fields/jiraIssueFetcher";
import { IJiraRepository } from "../../repository/jira/jiraRepository";
import {
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalXrayOptions,
} from "../../types/plugin";
import {
    CucumberMultipartFeature,
    ICucumberMultipart,
} from "../../types/xray/requests/importExecutionCucumberMultipart";
import { buildMultipartFeatures } from "./multipartFeatureBuilder";
import {
    IRunData,
    TestExecutionIssueData,
    TestExecutionIssueDataServer,
    buildMultipartInfoCloud,
    buildMultipartInfoServer,
} from "./multipartInfoBuilder";

/**
 * An interface containing all options which can be passed to the Cucumber multipart converter.
 */
export interface ImportExecutionCucumberMultipartConverterOptions {
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

/**
 * A class for converting Cucumber JSON results into Xray Cucumber multipart JSON.
 *
 * @see https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#ImportExecutionResultsREST-CucumberJSONresultsMultipart
 * @see https://docs.getxray.app/display/XRAYCLOUD/Import+Execution+Results+-+REST+v2#ImportExecutionResultsRESTv2-CucumberJSONresultsMultipart
 */
export class ImportExecutionCucumberMultipartConverter {
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
        private readonly options: ImportExecutionCucumberMultipartConverterOptions,
        private readonly isCloudConverter: boolean,
        private readonly jiraRepository: IJiraRepository
    ) {}

    /**
     * Converts Cucumber JSON results into Xray Cucumber multipart JSON. Additional Cypress run data
     * is required during conversion for some information like Cypress version or the browser used.
     *
     * @param input - the Cucumber JSON results
     * @param runData - the Cypress run data
     * @returns corresponding Xray Cucumber multipart JSON
     */
    public async convert(
        input: CucumberMultipartFeature[],
        runData: IRunData
    ): Promise<ICucumberMultipart> {
        const features = buildMultipartFeatures(input, {
            testExecutionIssueKey: this.options.jira.testExecutionIssueKey,
            includeScreenshots: this.options.xray.uploadScreenshots,
            projectKey: this.options.jira.projectKey,
            useCloudTags: this.isCloudConverter,
            testPrefix: this.options.cucumber?.prefixes.test,
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
                info: buildMultipartInfoCloud(runData, testExecutionIssueData),
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
                fieldId: await this.jiraRepository.getFieldId(SupportedFields.TEST_PLAN),
            };
        }
        if (this.options.xray.testEnvironments) {
            testExecutionIssueData.testEnvironments = {
                environments: this.options.xray.testEnvironments,
                fieldId: await this.jiraRepository.getFieldId(SupportedFields.TEST_ENVIRONMENTS),
            };
        }
        return {
            features: features,
            info: buildMultipartInfoServer(runData, testExecutionIssueData),
        };
    }
}
