import { Command, Computable, SkippedError } from "../../../commands/command";
import { LOG, Level } from "../../../logging/logging";

export class ExtractVideoFilesCommand extends Command<string[]> {
    private readonly cypressRunResult: Computable<CypressCommandLine.CypressRunResult>;
    private readonly resolvedExecutionIssueKey: Computable<string>;

    constructor(
        cypressRunResult: Computable<CypressCommandLine.CypressRunResult>,
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
            .map((run: CypressCommandLine.RunResult) => {
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
