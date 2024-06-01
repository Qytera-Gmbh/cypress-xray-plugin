import { XrayClient } from "../../../../client/xray/xray-client";
import { CucumberMultipart } from "../../../../types/xray/requests/import-execution-cucumber-multipart";
import { Level, Logger } from "../../../../util/logging";
import { Command, Computable } from "../../../command";

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
        this.logger.message(Level.INFO, "Uploading Cucumber test results");
        return await this.parameters.xrayClient.importExecutionCucumberMultipart(
            cucumberMultipart.features,
            cucumberMultipart.info
        );
    }
}
