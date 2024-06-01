import { FeatureFileIssueData } from "../../../types/cucumber/cucumber";
import { Logger } from "../../../util/logging";
import { Command, Computable } from "../../command";

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
