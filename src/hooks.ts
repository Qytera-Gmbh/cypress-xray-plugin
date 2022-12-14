import { PLUGIN_CONTEXT } from "./context";
import { validateConfiguration } from "./util/config";

export async function beforeRunHook(runDetails: Cypress.BeforeRunDetails) {
    validateConfiguration(runDetails.config.env);
}

export async function afterRunHook(
    results:
        | CypressCommandLine.CypressRunResult
        | CypressCommandLine.CypressFailedRunResult
) {
    if (results.status === "failed") {
        console.error(
            `Failed to run ${results.failures} tests:`,
            results.message
        );
        return;
    }
    console.log("┌───────────────────────────┐");
    console.log("│                           │");
    console.log("│    Cypress Xray Plugin    │");
    console.log("│                           │");
    console.log("└───────────────────────────┘");
    await PLUGIN_CONTEXT.uploader.uploadResults(
        results as CypressCommandLine.CypressRunResult
    );
}
