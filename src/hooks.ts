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
    console.log("┌───────────────────────────┐");
    console.log("│                           │");
    console.log("│    Cypress Xray Plugin    │");
    console.log("│                           │");
    console.log("└───────────────────────────┘");
    if (results.status === "failed") {
        console.error(
            `Aborting: failed to run ${results.failures} tests:`,
            results.message
        );
        return;
    }
    if (!PLUGIN_CONTEXT.xray.uploadResults) {
        console.log(
            "Skipping results upload: Plugin is configured to not upload test results."
        );
        return;
    }
    await PLUGIN_CONTEXT.client.importExecutionResults(
        results as CypressCommandLine.CypressRunResult
    );
}

export async function filePreprocessorHook(
    file: Cypress.FileObject
): Promise<string> {
    if (file.filePath.endsWith(PLUGIN_CONTEXT.cucumber.fileExtension)) {
        if (PLUGIN_CONTEXT.cucumber.downloadFeatures) {
            // TODO: download feature file from Xray.
        }
        if (PLUGIN_CONTEXT.cucumber.uploadFeatures) {
            const relativePath = file.filePath.substring(
                file.filePath.indexOf("cypress")
            );
            await PLUGIN_CONTEXT.client.importCucumberTests(
                file.filePath,
                PLUGIN_CONTEXT.jira.projectKey
            );
        }
    }
    return file.filePath;
}
