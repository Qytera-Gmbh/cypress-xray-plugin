import type { XrayClient } from "../../../../client/xray/xray-client";
import type { PluginEvents } from "../../../../types/plugin";
import type { CucumberMultipart } from "../../../../types/xray/requests/import-execution-cucumber-multipart";
import type { Logger } from "../../../../util/logging";
import type { Computable } from "../../../command";
import { Command } from "../../../command";

interface Parameters {
    on: PluginEvents["on"];
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
        const results = await this.cucumberMultipart.compute();
        const testExecutionIssueKey =
            await this.parameters.xrayClient.importExecutionCucumberMultipart(
                results.features,
                results.info
            );
        if (this.parameters.on) {
            await this.parameters.on("upload:cucumber", { results, testExecutionIssueKey });
        }
        return testExecutionIssueKey;
    }
}
