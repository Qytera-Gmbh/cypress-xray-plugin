import { XrayClient } from "../../client/xray/xrayClient";
import { CucumberMultipart } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { Command, Computable } from "../../util/command/command";

export class ImportExecutionCucumberCommand extends Command<string | null> {
    private readonly xrayClient: XrayClient;
    private readonly cucumberMultipart: Computable<CucumberMultipart>;
    constructor(xrayClient: XrayClient, cucumberMultipart: Computable<CucumberMultipart>) {
        super();
        this.xrayClient = xrayClient;
        this.cucumberMultipart = cucumberMultipart;
    }

    protected async computeResult(): Promise<string | null> {
        const cucumberMultipart = await this.cucumberMultipart.getResult();
        return await this.xrayClient.importExecutionCucumberMultipart(
            cucumberMultipart.features,
            cucumberMultipart.info
        );
    }
}
