import type { CypressRunResultType } from "../../../types/cypress/cypress";
import type { Logger } from "../../../util/logging";
import type { Computable } from "../../command";
import { Command } from "../../command";

export class ExtractVideoFilesCommand extends Command<string[], null> {
    private readonly cypressRunResult: Computable<CypressRunResultType>;

    constructor(logger: Logger, cypressRunResult: Computable<CypressRunResultType>) {
        super(null, logger);
        this.cypressRunResult = cypressRunResult;
    }
    protected async computeResult(): Promise<string[]> {
        const cypressRunResult = await this.cypressRunResult.compute();
        const videos = cypressRunResult.runs
            .map((run) => {
                return run.video;
            })
            .filter((value): value is string => typeof value === "string");
        return videos;
    }
}
