import { CypressRunResult as CypressRunResult_V_12 } from "../../types/cypress/12.0.0/api";
import { CypressRunResult as CypressRunResult_V_13 } from "../../types/cypress/13.0.0/api";
import { InternalOptions } from "../../types/plugin";
import { StringMap } from "../../types/util";
import {
    XrayTestCloud,
    XrayTestExecutionResults,
    XrayTestServer,
} from "../../types/xray/importTestExecutionResults";
import { dedent } from "../../util/dedent";
import { truncateISOTime } from "../../util/time";
import { Converter } from "../converter";
import { TestConverter } from "./testConverter";
import { TestConverterCloud } from "./testConverterCloud";
import { TestConverterServer } from "./testConverterServer";

export type TestIssueData = {
    summaries: StringMap<string>;
    testTypes: StringMap<string>;
};

type CypressRunResultType = CypressRunResult_V_12 | CypressRunResult_V_13;
type XrayTestType = XrayTestServer | XrayTestCloud;

export class ImportExecutionConverter extends Converter<
    CypressRunResultType,
    XrayTestExecutionResults<XrayTestType>,
    never
> {
    /**
     * Whether the converter is a cloud converter. Useful for automatically deducing which test
     * converters to use.
     */
    private readonly isCloudConverter: boolean;

    /**
     * Construct a new converter with access to the provided options. The cloud converter flag is
     * used to deduce which sub-converters to create, if necessary (for example for converting test
     * results). When set to `true`, Xray cloud JSONs will be created, if set to `false`, the format
     * will be Xray server JSON.
     *
     * @param options - the options
     * @param isCloudConverter - whether Xray cloud JSONs should be created
     */
    constructor(options: InternalOptions, isCloudConverter: boolean) {
        super(options);
        this.isCloudConverter = isCloudConverter;
    }

    public async convert(
        results: CypressRunResultType
    ): Promise<XrayTestExecutionResults<XrayTestType>> {
        let testConverter: TestConverter<XrayTestType>;
        if (this.isCloudConverter) {
            testConverter = new TestConverterCloud(this.options);
        } else {
            testConverter = new TestConverterServer(this.options);
        }
        return {
            testExecutionKey: this.options.jira.testExecutionIssueKey,
            info: {
                project: this.options.jira.projectKey,
                startDate: truncateISOTime(results.startedTestsAt),
                finishDate: truncateISOTime(results.endedTestsAt),
                description: this.getDescription(results),
                summary: this.getTextExecutionResultSummary(results),
                testPlanKey: this.options.jira.testPlanIssueKey,
            },
            tests: await testConverter.convert(results),
        };
    }

    private getTextExecutionResultSummary(results: CypressRunResultType): string | undefined {
        // Don't replace existing execution summaries with the default one.
        if (
            this.options.jira.testExecutionIssueKey &&
            !this.options.jira.testExecutionIssueSummary
        ) {
            return undefined;
        }
        return (
            this.options.jira.testExecutionIssueSummary ??
            `Execution Results [${new Date(results.startedTestsAt).getTime()}]`
        );
    }

    private getDescription(results: CypressRunResultType): string | undefined {
        // Don't replace existing execution descriptions with the default one.
        if (
            this.options.jira.testExecutionIssueKey &&
            !this.options.jira.testExecutionIssueDescription
        ) {
            return undefined;
        }
        return (
            this.options.jira.testExecutionIssueDescription ??
            dedent(`
                Cypress version: ${results.cypressVersion}
                Browser: ${results.browserName} (${results.browserVersion})
            `)
        );
    }
}
