import type { CypressRunResultType } from "../../../types/cypress/cypress.js";
import type { Logger } from "../../../util/logging.js";
import type { Computable } from "../../command.js";
import { Command } from "../../command.js";

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
