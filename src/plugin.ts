import {
    getPluginContext,
    initClients,
    initCucumberOptions,
    initJiraOptions,
    initOpenSSLOptions,
    initPluginOptions,
    initXrayOptions,
    setPluginContext,
} from "./context";
import { afterRunHook, beforeRunHook, synchronizeFile } from "./hooks";
import { Requests } from "./https/requests";
import { initLogging, logError, logInfo, logWarning } from "./logging/logging";
import { InternalOptions, InternalPluginOptions, Options } from "./types/plugin";
import { dedent } from "./util/dedent";

export async function configureXrayPlugin(config: Cypress.PluginConfigOptions, options: Options) {
    // Resolve these before all other options for correct enabledness.
    const pluginOptions: InternalPluginOptions = initPluginOptions(config.env, options.plugin);
    if (!pluginOptions.enabled) {
        logInfo("Plugin disabled. Skipping further configuration");
        return;
    }
    // Init logging before all other configurations because they might require an initialized
    // logging module.
    initLogging({
        debug: pluginOptions.debug,
        logDirectory: pluginOptions.logDirectory,
    });
    const internalOptions: InternalOptions = {
        jira: initJiraOptions(config.env, options.jira),
        plugin: pluginOptions,
        xray: initXrayOptions(config.env, options.xray),
        cucumber: await initCucumberOptions(config, options.cucumber),
        openSSL: initOpenSSLOptions(config.env, options.openSSL),
    };
    setPluginContext({
        cypress: config,
        internal: internalOptions,
        clients: initClients(internalOptions.jira, config.env),
    });
    Requests.init({
        debug: internalOptions.plugin.debug,
        openSSL: internalOptions.openSSL,
    });
}

export async function addXrayResultUpload(on: Cypress.PluginEvents) {
    on("before:run", async (runDetails: Cypress.BeforeRunDetails) => {
        const context = getPluginContext();
        if (!context) {
            logInitializationError("before:run");
            return;
        }
        if (!context.internal.plugin.enabled) {
            logInfo("Plugin disabled. Skipping before:run hook");
            return;
        }
        if (!runDetails.specs) {
            logWarning("No specs about to be executed. Skipping before:run hook");
            return;
        }
        await beforeRunHook(runDetails.specs, context.internal, context.clients);
    });
    on(
        "after:run",
        async (
            results: CypressCommandLine.CypressRunResult | CypressCommandLine.CypressFailedRunResult
        ) => {
            const context = getPluginContext();
            if (!context) {
                logInitializationError("after:run");
                return;
            }
            if (!context.internal.plugin.enabled) {
                logInfo("Skipping after:run hook: Plugin disabled");
                return;
            }
            if (!context.internal.xray.uploadResults) {
                logInfo("Skipping results upload: Plugin is configured to not upload test results");
                return;
            }
            if ("status" in results && results["status"] === "failed") {
                const failedResult = results as CypressCommandLine.CypressFailedRunResult;
                logError(
                    dedent(`
                        Skipping after:run hook: Failed to run ${failedResult.failures} tests

                        ${failedResult.message}
                    `)
                );
                return;
            }
            await afterRunHook(
                results as CypressCommandLine.CypressRunResult,
                context.internal,
                context.clients
            );
        }
    );
}

export async function syncFeatureFile(file: Cypress.FileObject): Promise<string> {
    const context = getPluginContext();
    if (!context) {
        logInitializationError("file:preprocessor");
        return file.filePath;
    }
    if (!context.internal.plugin.enabled) {
        logInfo(
            `Plugin disabled. Skipping feature file synchronization triggered by: ${file.filePath}`
        );
        return file.filePath;
    }
    return await synchronizeFile(
        file,
        context.cypress.projectRoot,
        context.internal,
        context.clients
    );
}

function logInitializationError(hook: "before:run" | "after:run" | "file:preprocessor"): void {
    // Do not throw in case someone does not want the plugin to run but forgot to remove a hook.
    logError(
        dedent(`
            Skipping ${hook} hook: Plugin misconfigured: configureXrayPlugin() was not called

            Make sure your project is set up correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/introduction/
        `)
    );
}
