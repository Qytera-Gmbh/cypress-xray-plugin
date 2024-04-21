import { CucumberMultipart } from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import { SkippedError } from "../../../../../util/errors";
import { Command, CommandDescription, Computable } from "../../../../command";

export class AssertCucumberConversionValidCommand extends Command<void, void> {
    private readonly cucumberMultipart: Computable<CucumberMultipart>;

    constructor(cucumberMultipart: Computable<CucumberMultipart>) {
        super();
        this.cucumberMultipart = cucumberMultipart;
    }

    public getDescription(): CommandDescription {
        return {
            description: "Asserts that a Cucumber report contains at least one executed test.",
            runtimeInputs: ["the Cucumber report"],
        };
    }

    protected async computeResult(): Promise<void> {
        const cucumberMultipart = await this.cucumberMultipart.compute();
        if (cucumberMultipart.features.length === 0) {
            throw new SkippedError(
                "Skipping Cucumber results upload: No Cucumber tests were executed"
            );
        }
    }
}
