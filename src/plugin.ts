import { initClients, initJiraRepository, initOptions, verifyOptions } from "./context";
import { afterRunHook, beforeRunHook, synchronizeFile } from "./hooks";
import { Requests } from "./https/requests";
import { initLogging, logInfo } from "./logging/logging";
import { Options, PluginContext } from "./types/plugin";

let context: PluginContext;

export async function configureXrayPlugin(config: Cypress.PluginConfigOptions, options: Options) {
    context = {
        cypress: config,
        internal: initOptions(config.env, options),
    };
    if (!context.internal.plugin.enabled) {
        logInfo("Plugin disabled. Skipping configuration verification.");
        return;
    }
    verifyOptions(context.internal);
    const clients = initClients(context.internal, config.env);
    context.xrayClient = clients.xrayClient;
    context.jiraClient = clients.jiraClient;
    context.jiraRepository = initJiraRepository(clients, options);
    Requests.init(context.internal);
    initLogging({
        debug: context.internal.plugin.debug,
        logDirectory: context.internal.plugin.logDirectory,
    });
}

export async function addXrayResultUpload(on: Cypress.PluginEvents) {
    on("before:run", async (runDetails: Cypress.BeforeRunDetails) => {
        await beforeRunHook(
            runDetails,
            context.cypress,
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
            await afterRunHook(
                results,
                context.internal,
                context.xrayClient,
                context.jiraClient,
                context.jiraRepository
            );
        }
    );
}

export async function syncFeatureFile(file: Cypress.FileObject): Promise<string> {
    return await synchronizeFile(
        file,
        context.cypress.projectRoot,
        context.internal,
        context.xrayClient,
        context.jiraClient,
        context.jiraRepository
    );
}
