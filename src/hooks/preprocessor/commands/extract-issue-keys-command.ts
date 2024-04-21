import { FeatureFileIssueData } from "../../../types/cucumber/cucumber";
import { Command, CommandDescription, Computable } from "../../command";

export class ExtractIssueKeysCommand extends Command<string[], void> {
    private readonly issueData: Computable<FeatureFileIssueData>;

    constructor(issueData: Computable<FeatureFileIssueData>) {
        super();
        this.issueData = issueData;
    }

    public getDescription(): CommandDescription {
        return {
            description: "Extracts issues keys from parsed Gherkin tests and preconditions.",
            runtimeInputs: ["Gherkin tests and precondition data"],
        };
    }

    protected async computeResult(): Promise<string[]> {
        const issueData = await this.issueData.compute();
        return [
            ...issueData.tests.map((data) => data.key),
            ...issueData.preconditions.map((data) => data.key),
        ];
    }
}
