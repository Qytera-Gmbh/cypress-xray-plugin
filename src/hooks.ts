import { PLUGIN_CONTEXT } from "./context";
import { error, log } from "./logging/logging";
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
        error(
            `Aborting: failed to run ${results.failures} tests:`,
            results.message
        );
        return;
    }
    if (!PLUGIN_CONTEXT.xray.uploadResults) {
        log(
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
            log(`Synchronizing upstream Cucumber tests (${relativePath})`);
            await PLUGIN_CONTEXT.client.importCucumberTests(
                file.filePath,
                PLUGIN_CONTEXT.jira.projectKey
            );
        }
    }
    return file.filePath;
}
