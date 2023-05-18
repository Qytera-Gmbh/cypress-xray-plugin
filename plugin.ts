import { initContext } from "./src/context";
import { afterRunHook, beforeRunHook, filePreprocessorHook } from "./src/hooks";
import { Options } from "./src/types/xray/plugin";

export async function configureXrayPlugin(options: Options) {
    initContext(options);
}

export async function addXrayResultUpload(on: Cypress.PluginEvents) {
    on("before:run", async (details: Cypress.BeforeRunDetails) => {
        await beforeRunHook(details);
    });

    on(
        "after:run",
        async (
            results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult
        ) => {
            await afterRunHook(results);
        }
    );
}

export function syncFeatureFile(file: Cypress.FileObject): Promise<string> {
    return filePreprocessorHook(file);
}
