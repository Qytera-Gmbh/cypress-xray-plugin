import { XrayTestExecutionResults } from "../../../../../types/xray/import-test-execution-results";
import { SkippedError } from "../../../../../util/errors";
import { Command, Computable } from "../../../../command";

export class AssertCypressConversionValidCommand extends Command<void, void> {
    private readonly xrayTestExecutionResults: Computable<XrayTestExecutionResults>;

    constructor(xrayTestExecutionResults: Computable<XrayTestExecutionResults>) {
        super();
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
