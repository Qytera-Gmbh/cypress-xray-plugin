import { initClients, initOptions, verifyOptions } from "./context";
import { afterRunHook, beforeRunHook, synchronizeFile } from "./hooks";
import { Requests } from "./https/requests";
import { initLogging, logInfo } from "./logging/logging";
import { Options, PluginContext } from "./types/plugin";

let context: PluginContext;

export async function configureXrayPlugin(config: Cypress.PluginConfigOptions, options: Options) {
    const internalOptions = initOptions(config.env, options);
    if (!internalOptions.plugin.enabled) {
        logInfo("Plugin disabled. Skipping configuration verification.");
        return;
    }
    verifyOptions(internalOptions);
    const { jiraClient, xrayClient } = initClients(internalOptions, config.env);
    context = {
        internal: internalOptions,
        cypress: config,
        xrayClient: xrayClient,
        jiraClient: jiraClient,
    };
    Requests.init(internalOptions);
    initLogging({
        logDirectory: internalOptions.plugin.logDirectory,
    });
}

export async function addXrayResultUpload(on: Cypress.PluginEvents) {
    on("before:run", async (runDetails: Cypress.BeforeRunDetails) => {
        await beforeRunHook(
            context.cypress,
            runDetails,
            context.internal,
            context.xrayClient,
            context.jiraClient
        );
    });
    on(
        "after:run",
        async (
            results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult
        ) => {
            await afterRunHook(results, context.internal, context.xrayClient);
        }
    );
}

export async function syncFeatureFile(file: Cypress.FileObject): Promise<string> {
    return await synchronizeFile(
        file,
        context.cypress.projectRoot,
        context.internal,
        context.xrayClient
    );
}
