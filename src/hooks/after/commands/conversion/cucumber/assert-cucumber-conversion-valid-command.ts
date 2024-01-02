import { CucumberMultipart } from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import { Command, Computable, SkippedError } from "../../../../command";

export class AssertCucumberConversionValidCommand extends Command<void> {
    private readonly cucumberMultipart: Computable<CucumberMultipart>;

    constructor(cucumberMultipart: Computable<CucumberMultipart>) {
        super();
        this.cucumberMultipart = cucumberMultipart;
    }

    protected async computeResult(): Promise<void> {
        const cucumberMultipart = await this.cucumberMultipart.compute();
        if (cucumberMultipart.features.length === 0) {
            throw new SkippedError("No Cucumber tests were executed. Skipping Cucumber upload.");
        }
    }
}
