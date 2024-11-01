import type { CucumberMultipart } from "../../../../../types/xray/requests/import-execution-cucumber-multipart.js";
import { SkippedError } from "../../../../../util/errors.js";
import type { Logger } from "../../../../../util/logging.js";
import type { Computable } from "../../../../command.js";
import { Command } from "../../../../command.js";

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
