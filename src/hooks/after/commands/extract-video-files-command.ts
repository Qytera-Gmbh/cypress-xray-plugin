import { CypressRunResultType } from "../../../types/cypress/run-result";
import { LOG, Level } from "../../../util/logging";
import { Command, Computable, SkippedError } from "../../command";

export class ExtractVideoFilesCommand extends Command<string[]> {
    private readonly cypressRunResult: Computable<CypressRunResultType>;
    private readonly resolvedExecutionIssueKey: Computable<string>;

    constructor(
        cypressRunResult: Computable<CypressRunResultType>,
        resolvedExecutionIssueKey: Computable<string>
    ) {
        super();
        this.cypressRunResult = cypressRunResult;
        this.resolvedExecutionIssueKey = resolvedExecutionIssueKey;
    }
    protected async computeResult(): Promise<string[]> {
        const cypressRunResult = await this.cypressRunResult.compute();
        const resolvedExecutionIssueKey = await this.resolvedExecutionIssueKey.compute();
        const videos = cypressRunResult.runs
            .map((run) => {
                return run.video;
            })
            .filter((value): value is string => typeof value === "string");
        if (videos.length === 0) {
            throw new SkippedError(
                `Skipping attaching videos to test execution issue ${resolvedExecutionIssueKey}: No videos were captured`
            );
        } else {
            LOG.message(
                Level.INFO,
                `Attaching videos to text execution issue ${resolvedExecutionIssueKey}`
            );
        }
        return videos;
    }
}
