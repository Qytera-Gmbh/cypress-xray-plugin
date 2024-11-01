import type { XrayClient } from "../../../../client/xray/xray-client.js";
import type { CucumberMultipart } from "../../../../types/xray/requests/import-execution-cucumber-multipart.js";
import type { Logger } from "../../../../util/logging.js";
import type { Computable } from "../../../command.js";
import { Command } from "../../../command.js";

interface Parameters {
    xrayClient: XrayClient;
}

export class ImportExecutionCucumberCommand extends Command<string, Parameters> {
    private readonly cucumberMultipart: Computable<CucumberMultipart>;
    constructor(
        parameters: Parameters,
        logger: Logger,
        cucumberMultipart: Computable<CucumberMultipart>
    ) {
        super(parameters, logger);
        this.cucumberMultipart = cucumberMultipart;
    }

    protected async computeResult(): Promise<string> {
        const cucumberMultipart = await this.cucumberMultipart.compute();
        return await this.parameters.xrayClient.importExecutionCucumberMultipart(
            cucumberMultipart.features,
            cucumberMultipart.info
        );
    }
}
