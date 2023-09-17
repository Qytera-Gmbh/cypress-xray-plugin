import { XrayEvidenceItem, XrayTestServer } from "../../types/xray/importTestExecutionResults";
import { truncateISOTime } from "../../util/time";
import { getXrayStatus } from "./statusConversion";
import { ITestRunData } from "./testConversion";
import { TestConverter } from "./testConverter";

export class TestConverterServer extends TestConverter<XrayTestServer> {
    protected getTest(
        test: ITestRunData,
        issueKey: string,
        issueData: {
            summary: string;
            testType: string;
        },
        evidence: XrayEvidenceItem[]
    ): XrayTestServer {
        // TODO: Support multiple iterations.
        const xrayTest: XrayTestServer = {
            testKey: issueKey,
            testInfo: {
                projectKey: this.options.jira.projectKey,
                summary: issueData.summary,
                testType: issueData.testType,
            },
            start: truncateISOTime(test.startedAt.toISOString()),
            finish: truncateISOTime(
                new Date(test.startedAt.getTime() + test.duration).toISOString()
            ),
            status: getXrayStatus(test.status, false, this.options.xray.status),
        };
        if (evidence.length > 0) {
            xrayTest.evidence = evidence;
        }
        return xrayTest;
    }
}
