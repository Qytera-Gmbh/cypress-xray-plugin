import type { XrayClient } from "../../../../../client/xray/xray-client";
import { SkippedError } from "../../../../../util/errors";
import type { Logger } from "../../../../../util/logging";
import type { Computable } from "../../../../command";
import { Command } from "../../../../command";

export class AssertCypressConversionValidCommand extends Command<void, null> {
    private readonly xrayTestExecutionResults: Computable<
        Parameters<XrayClient["importExecutionMultipart"]>
    >;

    constructor(
        logger: Logger,
        xrayTestExecutionResults: Computable<Parameters<XrayClient["importExecutionMultipart"]>>
    ) {
        super(null, logger);
        this.xrayTestExecutionResults = xrayTestExecutionResults;
    }

    protected async computeResult(): Promise<void> {
        const [results] = await this.xrayTestExecutionResults.compute();
        if (!results.tests || results.tests.length === 0) {
            throw new SkippedError(
                "Skipping Cypress results upload: No native Cypress tests were executed"
            );
        }
    }
}
