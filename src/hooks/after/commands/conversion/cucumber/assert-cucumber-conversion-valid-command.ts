import { CucumberMultipart } from "../../../../../types/xray/requests/import-execution-cucumber-multipart";
import { SkippedError } from "../../../../../util/errors";
import { Logger } from "../../../../../util/logging";
import { Command, Computable } from "../../../../command";

export class AssertCucumberConversionValidCommand extends Command<void, null> {
    private readonly cucumberMultipart: Computable<CucumberMultipart>;

    constructor(logger: Logger, cucumberMultipart: Computable<CucumberMultipart>) {
        super(null, logger);
        this.cucumberMultipart = cucumberMultipart;
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
