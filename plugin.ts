import { afterRunHook, beforeRunHook, filePreprocessorHook } from "./src/hooks";

export async function addXrayResultUpload(on: Cypress.PluginEvents) {
    on("before:run", async (details: Cypress.BeforeRunDetails) => {
        await beforeRunHook(details);
    });

    on(
        "after:run",
        async (
            results:
                | CypressCommandLine.CypressRunResult
                | CypressCommandLine.CypressFailedRunResult
        ) => {
            await afterRunHook(results);
        }
    );
}
export function syncFeatureFile(file: Cypress.FileObject): Promise<string> {
    return filePreprocessorHook(file);
}
