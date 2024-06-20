import { XrayClient } from "../../../../client/xray/xray-client";
import { XrayTestExecutionResults } from "../../../../types/xray/import-test-execution-results";
import { Logger } from "../../../../util/logging";
import { Command, Computable } from "../../../command";

interface Parameters {
    xrayClient: XrayClient;
}

export class ImportExecutionCypressCommand extends Command<string, Parameters> {
    private readonly results: Computable<XrayTestExecutionResults>;
    constructor(
        parameters: Parameters,
        logger: Logger,
        results: Computable<XrayTestExecutionResults>
    ) {
        super(parameters, logger);
        this.results = results;
    }

    protected async computeResult(): Promise<string> {
        const results = await this.results.compute();
        return await this.parameters.xrayClient.importExecution(results);
    }
}
