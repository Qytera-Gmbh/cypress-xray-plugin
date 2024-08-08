import { XrayClient } from "../../../../client/xray/xray-client";
import { Logger } from "../../../../util/logging";
import { Command, Computable } from "../../../command";

interface CommandParameters {
    xrayClient: XrayClient;
}

export class ImportExecutionCypressCommand extends Command<string, CommandParameters> {
    private readonly execution: Computable<Parameters<XrayClient["importExecutionMultipart"]>>;
    constructor(
        parameters: CommandParameters,
        logger: Logger,
        execution: Computable<Parameters<XrayClient["importExecutionMultipart"]>>
    ) {
        super(parameters, logger);
        this.execution = execution;
    }

    protected async computeResult(): Promise<string> {
        const [results, info] = await this.execution.compute();
        return await this.parameters.xrayClient.importExecutionMultipart(results, info);
    }
}
