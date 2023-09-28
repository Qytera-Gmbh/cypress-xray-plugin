import {
    initClients,
    initCucumberOptions,
    initJiraOptions,
    initOpenSSLOptions,
    initPluginOptions,
    initXrayOptions,
} from "./context";
import { afterRunHook, beforeRunHook, synchronizeFile } from "./hooks";
import { Requests } from "./https/requests";
import { initLogging, logInfo } from "./logging/logging";
import { InternalOptions, Options, PluginContext } from "./types/plugin";

let context: PluginContext;

export async function configureXrayPlugin(config: Cypress.PluginConfigOptions, options: Options) {
    const internalOptions: InternalOptions = {
        jira: initJiraOptions(config.env, options.jira),
        plugin: initPluginOptions(config.env, options.plugin),
        xray: initXrayOptions(config.env, options.xray),
        cucumber: await initCucumberOptions(config, options.cucumber),
        openSSL: initOpenSSLOptions(config.env, options.openSSL),
    };
    if (!internalOptions.plugin.enabled) {
        logInfo("Plugin disabled. Skipping configuration verification.");
        return;
    }
    context = {
        cypress: config,
        internal: internalOptions,
        clients: initClients(internalOptions.jira, config.env),
    };
    Requests.init(context.internal);
    initLogging({
        debug: context.internal.plugin.debug,
        logDirectory: context.internal.plugin.logDirectory,
    });
}

export async function addXrayResultUpload(on: Cypress.PluginEvents) {
    on("before:run", async (runDetails: Cypress.BeforeRunDetails) => {
        await beforeRunHook(runDetails, context.internal, context.clients);
    });
    on(
        "after:run",
        async (
            results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult
        ) => {
            await afterRunHook(results, context.internal, context.clients);
        }
    );
}

export async function syncFeatureFile(file: Cypress.FileObject): Promise<string> {
    return await synchronizeFile(
        file,
        context.cypress.projectRoot,
        context.internal,
        context.clients
    );
}
