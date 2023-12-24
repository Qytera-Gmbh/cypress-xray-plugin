import { IXrayClient } from "../../client/xray/xrayClient";
import { ICucumberMultipart } from "../../types/xray/requests/importExecutionCucumberMultipart";
import { Command } from "../../util/command/command";

export class ImportExecutionCucumberCommand extends Command<string | null> {
    constructor(
        private readonly xrayClient: IXrayClient,
        private readonly cucumberMultipart: ICucumberMultipart
    ) {
        super();
        this.xrayClient = xrayClient;
        this.cucumberMultipart = cucumberMultipart;
    }

    protected async computeResult(): Promise<string | null> {
        return await this.xrayClient.importExecutionCucumberMultipart(
            this.cucumberMultipart.features,
            this.cucumberMultipart.info
        );
    }
}
