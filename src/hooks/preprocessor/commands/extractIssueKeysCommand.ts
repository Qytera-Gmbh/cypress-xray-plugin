import { FeatureFileIssueData } from "../../../util/preprocessing";
import { Command, Computable } from "../../command";

export class ExtractIssueKeysCommand extends Command<string[]> {
    private readonly issueData: Computable<FeatureFileIssueData>;

    constructor(issueData: Computable<FeatureFileIssueData>) {
        super();
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
