import type { FeatureFileIssueData } from "../../../types/cucumber/cucumber.js";
import type { Logger } from "../../../util/logging.js";
import type { Computable } from "../../command.js";
import { Command } from "../../command.js";

export class ExtractIssueKeysCommand extends Command<string[], null> {
    private readonly issueData: Computable<FeatureFileIssueData>;

    constructor(logger: Logger, issueData: Computable<FeatureFileIssueData>) {
        super(null, logger);
        this.issueData = issueData;
    }

    protected async computeResult(): Promise<string[]> {
        const issueData = await this.issueData.compute();
        return [
            ...issueData.tests.map((data) => data.key),
            ...issueData.preconditions.map((data) => data.key),
        ];
    }
}
