import { XrayEvidenceItem, XrayTestCloud } from "../../types/xray/importTestExecutionResults";
import { truncateISOTime } from "../../util/time";
import { TestIssueData } from "./importExecutionConverter";
import { getXrayStatus } from "./statusConversion";
import { ITestRunData } from "./testConversion";
import { TestConverter } from "./testConverter";

export class TestConverterCloud extends TestConverter<XrayTestCloud> {
    protected getTest(
        test: ITestRunData,
        issueKey: string,
        issueData?: TestIssueData,
        evidence?: XrayEvidenceItem[]
    ): XrayTestCloud {
        if (!issueData?.summaries[issueKey]) {
            throw new Error(`Summary of corresponding issue is missing: ${issueKey}`);
        }
        if (!issueData?.testTypes[issueKey]) {
            throw new Error(`Test type of corresponding issue is missing: ${issueKey}`);
        }
        // TODO: Support multiple iterations.
        return {
            testKey: issueKey,
            testInfo: {
                projectKey: this.options.jira.projectKey,
                summary: issueData.summaries[issueKey],
                type: issueData.testTypes[issueKey],
            },
            start: truncateISOTime(test.startedAt.toISOString()),
            finish: truncateISOTime(
                new Date(test.startedAt.getMilliseconds() + test.duration).toISOString()
            ),
            status: getXrayStatus(test.status, true, this.options.xray.status),
            evidence: evidence,
        };
    }
}
