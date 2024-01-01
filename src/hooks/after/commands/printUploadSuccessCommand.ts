import { LOG, Level } from "../../../logging/logging";
import { Command, Computable } from "../../command";

interface Parameters {
    url: string;
}

export class PrintUploadSuccessCommand extends Command<void> {
    private readonly parameters: Parameters;
    private readonly resolvedExecutionIssueKey: Computable<string>;

    constructor(parameters: Parameters, resolvedExecutionIssueKey: Computable<string>) {
        super();
        this.parameters = parameters;
        this.resolvedExecutionIssueKey = resolvedExecutionIssueKey;
    }

    protected async computeResult(): Promise<void> {
        const resolvedExecutionIssueKey = await this.resolvedExecutionIssueKey.compute();
        LOG.message(
            Level.SUCCESS,
            `Uploaded test results to issue: ${resolvedExecutionIssueKey} (${this.parameters.url}/browse/${resolvedExecutionIssueKey})`
        );
    }
}
