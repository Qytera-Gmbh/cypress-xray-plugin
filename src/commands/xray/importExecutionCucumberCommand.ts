import { XrayClient } from "../../client/xray/xrayClient";
import { LOG, Level } from "../../logging/logging";
import { CucumberMultipart } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { Command, Computable } from "../command";

export class ImportExecutionCucumberCommand extends Command<string> {
    private readonly xrayClient: XrayClient;
    private readonly cucumberMultipart: Computable<CucumberMultipart>;
    constructor(xrayClient: XrayClient, cucumberMultipart: Computable<CucumberMultipart>) {
        super();
        this.xrayClient = xrayClient;
        this.cucumberMultipart = cucumberMultipart;
    }

    protected async computeResult(): Promise<string> {
        const cucumberMultipart = await this.cucumberMultipart.compute();
        LOG.message(Level.INFO, "Uploading Cucumber test results");
        return await this.xrayClient.importExecutionCucumberMultipart(
            cucumberMultipart.features,
            cucumberMultipart.info
        );
    }
}
