import { XrayClient } from "../../client/xray/xrayClient";
import { XrayTestExecutionResults } from "../../types/xray/importTestExecutionResults";
import { Command, Computable } from "../../util/command/command";

export class ImportExecutionCypressCommand extends Command<string | null> {
    constructor(
        private readonly xrayClient: XrayClient,
        private readonly results: Computable<XrayTestExecutionResults>
    ) {
        super();
        this.xrayClient = xrayClient;
        this.results = results;
    }

    protected async computeResult(): Promise<string | null> {
        const results = await this.results.getResult();
        return await this.xrayClient.importExecution(results);
    }
}
