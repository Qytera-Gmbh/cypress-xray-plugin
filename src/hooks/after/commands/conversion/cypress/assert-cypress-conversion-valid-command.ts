import { XrayTestExecutionResults } from "../../../../../types/xray/import-test-execution-results";
import { SkippedError } from "../../../../../util/errors";
import { Logger } from "../../../../../util/logging";
import { Command, Computable } from "../../../../command";

export class AssertCypressConversionValidCommand extends Command<void, null> {
    private readonly xrayTestExecutionResults: Computable<XrayTestExecutionResults>;

    constructor(logger: Logger, xrayTestExecutionResults: Computable<XrayTestExecutionResults>) {
        super(null, logger);
        this.xrayTestExecutionResults = xrayTestExecutionResults;
    }

    protected async computeResult(): Promise<void> {
        const xrayTestExecutionResults = await this.xrayTestExecutionResults.compute();
        if (!xrayTestExecutionResults.tests || xrayTestExecutionResults.tests.length === 0) {
            throw new SkippedError(
                "Skipping Cypress results upload: No native Cypress tests were executed"
            );
        }
    }
}
