import { IXrayClient } from "../../client/xray/xrayClient";
import { ICucumberMultipart } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { Command, Computable } from "../../util/command/command";

export class ImportExecutionCucumberCommand extends Command<string | null> {
    constructor(
        private readonly xrayClient: IXrayClient,
        private readonly cucumberMultipart: Computable<ICucumberMultipart>
    ) {
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
