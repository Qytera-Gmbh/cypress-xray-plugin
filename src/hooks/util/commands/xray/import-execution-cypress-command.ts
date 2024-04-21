import { XrayClient } from "../../../../client/xray/xray-client";
import { XrayTestExecutionResults } from "../../../../types/xray/import-test-execution-results";
import { Level } from "../../../../util/logging";
import { Command, Computable } from "../../../command";

interface Parameters {
    xrayClient: XrayClient;
}

export class ImportExecutionCypressCommand extends Command<string, Parameters> {
    private readonly results: Computable<XrayTestExecutionResults>;
    constructor(parameters: Parameters, results: Computable<XrayTestExecutionResults>) {
        super(parameters);
        this.results = results;
    }

    protected async computeResult(): Promise<string> {
        const results = await this.results.compute();
        this.logger.message(Level.INFO, "Uploading Cypress test results");
        return await this.parameters.xrayClient.importExecution(results);
    }
}
