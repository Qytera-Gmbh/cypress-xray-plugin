import { XrayEvidenceItem, XrayTestCloud } from "../../types/xray/importTestExecutionResults";
import { truncateISOTime } from "../../util/time";
import { ITestRunData } from "./runConversion";
import { getXrayStatus } from "./statusConversion";
import { TestConverter } from "./testConverter";

export class TestConverterCloud extends TestConverter<XrayTestCloud> {
    protected getTest(
        test: ITestRunData,
        issueKey: string,
        issueData: {
            summary: string;
            testType: string;
        },
        evidence: XrayEvidenceItem[]
    ): XrayTestCloud {
        // TODO: Support multiple iterations.
        const xrayTest: XrayTestCloud = {
            testKey: issueKey,
            testInfo: {
                projectKey: this.options.jira.projectKey,
                summary: issueData.summary,
                type: issueData.testType,
            },
            start: truncateISOTime(test.startedAt.toISOString()),
            finish: truncateISOTime(
                new Date(test.startedAt.getTime() + test.duration).toISOString()
            ),
            status: getXrayStatus(test.status, true, this.options.xray.status),
        };
        if (evidence.length > 0) {
            xrayTest.evidence = evidence;
        }
        return xrayTest;
    }
}
