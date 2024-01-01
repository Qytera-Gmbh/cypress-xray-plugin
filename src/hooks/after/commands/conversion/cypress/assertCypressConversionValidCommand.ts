import { XrayTestExecutionResults } from "../../../../../types/xray/importTestExecutionResults";
import { Command, Computable, SkippedError } from "../../../../command";

export class AssertCypressConversionValidCommand extends Command<void> {
    private readonly xrayTestExecutionResults: Computable<XrayTestExecutionResults>;

    constructor(xrayTestExecutionResults: Computable<XrayTestExecutionResults>) {
        super();
        this.xrayTestExecutionResults = xrayTestExecutionResults;
    }

    protected async computeResult(): Promise<void> {
        const xrayTestExecutionResults = await this.xrayTestExecutionResults.compute();
        if (!xrayTestExecutionResults.tests || xrayTestExecutionResults.tests.length === 0) {
            throw new SkippedError(
                "No native Cypress tests were executed. Skipping native upload."
            );
        }
    }
}
