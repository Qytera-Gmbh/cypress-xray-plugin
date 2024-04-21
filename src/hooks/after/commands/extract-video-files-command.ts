import { CypressRunResultType } from "../../../types/cypress/run-result";
import { Command, CommandDescription, Computable } from "../../command";

export class ExtractVideoFilesCommand extends Command<string[], void> {
    private readonly cypressRunResult: Computable<CypressRunResultType>;

    constructor(cypressRunResult: Computable<CypressRunResultType>) {
        super();
        this.cypressRunResult = cypressRunResult;
    }

    public getDescription(): CommandDescription {
        return {
            description:
                "Extracts video files captured during test execution from Cypress run results.",
            runtimeInputs: ["the Cypress run results"],
        };
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
