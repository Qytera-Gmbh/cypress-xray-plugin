import { XrayClient } from "../../../../client/xray/xray-client";
import { XrayTestExecutionResults } from "../../../../types/xray/import-test-execution-results";
import { LOG, Level } from "../../../../util/logging";
import { Command, CommandDescription, Computable } from "../../../command";

interface Parameters {
    xrayClient: XrayClient;
}

export class ImportExecutionCypressCommand extends Command<string, Parameters> {
    private readonly results: Computable<XrayTestExecutionResults>;
    constructor(parameters: Parameters, results: Computable<XrayTestExecutionResults>) {
        super(parameters);
        this.results = results;
    }

    public getDescription(): CommandDescription {
        return {
            description: "Imports a Cypress test run to Xray.",
            runtimeInputs: ["the Cypress test execution results in Xray JSON format"],
        };
    }

    protected async computeResult(): Promise<string> {
        const results = await this.results.compute();
        LOG.message(Level.INFO, "Uploading Cypress test results");
        return await this.parameters.xrayClient.importExecution(results);
    }
}
