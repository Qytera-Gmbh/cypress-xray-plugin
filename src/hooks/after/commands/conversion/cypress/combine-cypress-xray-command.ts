import type { XrayClient } from "../../../../../client/xray/xray-client";
import type { XrayTest } from "../../../../../types/xray/import-test-execution-results";
import type { MultipartInfo } from "../../../../../types/xray/requests/import-execution-multipart-info";
import type { Logger } from "../../../../../util/logging";
import type { Computable } from "../../../../command";
import { Command } from "../../../../command";

interface CommandParameters {
    testExecutionIssueKey?: string;
}

export class CombineCypressJsonCommand extends Command<
    Parameters<XrayClient["importExecutionMultipart"]>,
    CommandParameters
> {
    private readonly cypressTestsJson: Computable<[XrayTest, ...XrayTest[]]>;
    private readonly info: Computable<MultipartInfo>;

    constructor(
        parameters: CommandParameters,
        logger: Logger,
        cypressTestsJson: Computable<[XrayTest, ...XrayTest[]]>,
        info: Computable<MultipartInfo>
    ) {
        super(parameters, logger);
        this.cypressTestsJson = cypressTestsJson;
        this.info = info;
    }

    protected async computeResult(): Promise<Parameters<XrayClient["importExecutionMultipart"]>> {
        const results = await this.cypressTestsJson.compute();
        const info = await this.info.compute();
        return [
            {
                testExecutionKey: this.parameters.testExecutionIssueKey,
                tests: results,
            },
            info,
        ];
    }
}
