import { XrayClient } from "../../../../client/xray/xray-client";
import { CucumberMultipart } from "../../../../types/xray/requests/import-execution-cucumber-multipart";
import { LOG, Level } from "../../../../util/logging";
import { Command, Computable } from "../../../command";

interface Parameters {
    xrayClient: XrayClient;
}

export class ImportExecutionCucumberCommand extends Command<string, Parameters> {
    private readonly cucumberMultipart: Computable<CucumberMultipart>;
    constructor(parameters: Parameters, cucumberMultipart: Computable<CucumberMultipart>) {
        super(parameters);
        this.cucumberMultipart = cucumberMultipart;
    }

    protected async computeResult(): Promise<string> {
        const cucumberMultipart = await this.cucumberMultipart.compute();
        LOG.message(Level.INFO, "Uploading Cucumber test results");
        return await this.parameters.xrayClient.importExecutionCucumberMultipart(
            cucumberMultipart.features,
            cucumberMultipart.info
        );
    }
}
