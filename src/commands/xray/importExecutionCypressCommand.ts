import { XrayClient } from "../../client/xray/xrayClient";
import { XrayTestExecutionResults } from "../../types/xray/importTestExecutionResults";
import { Command, Computable } from "../command";

export class ImportExecutionCypressCommand extends Command<string> {
    private readonly xrayClient: XrayClient;
    private readonly results: Computable<XrayTestExecutionResults>;
    constructor(xrayClient: XrayClient, results: Computable<XrayTestExecutionResults>) {
        super();
        this.xrayClient = xrayClient;
        this.results = results;
    }

    protected async computeResult(): Promise<string> {
        const results = await this.results.compute();
        return await this.xrayClient.importExecution(results);
    }
}
