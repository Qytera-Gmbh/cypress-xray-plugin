import { InternalJiraOptions } from "../../../../../types/plugin";
import {
    XrayTest,
    XrayTestExecutionInfo,
    XrayTestExecutionResults,
} from "../../../../../types/xray/import-test-execution-results";
import { Logger } from "../../../../../util/logging";
import { Command, Computable } from "../../../../command";

type Parameters = Pick<InternalJiraOptions, "testExecutionIssueKey">;

export class CombineCypressJsonCommand extends Command<XrayTestExecutionResults, Parameters> {
    private readonly cypressTestsJson: Computable<[XrayTest, ...XrayTest[]]>;
    private readonly cypressTestsInfo: Computable<XrayTestExecutionInfo>;

    constructor(
        parameters: Parameters,
        logger: Logger,
        cypressTestsJson: Computable<[XrayTest, ...XrayTest[]]>,
        cypressTestsInfo: Computable<XrayTestExecutionInfo>
    ) {
        super(parameters, logger);
        this.cypressTestsJson = cypressTestsJson;
        this.cypressTestsInfo = cypressTestsInfo;
    }

    protected async computeResult(): Promise<XrayTestExecutionResults> {
        const cypressTestsJson = await this.cypressTestsJson.compute();
        const cypressTestsInfo = await this.cypressTestsInfo.compute();
        return {
            info: cypressTestsInfo,
            testExecutionKey: this.parameters.testExecutionIssueKey,
            tests: cypressTestsJson,
        };
    }
}
