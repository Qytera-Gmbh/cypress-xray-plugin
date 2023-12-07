import {
    clearPluginContext,
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
import { HELP } from "./util/help";

let canShowInitializationWarning: boolean = true;

/**
 * Resets the plugin including its context.
 */
export function resetPlugin(): void {
    clearPluginContext();
    canShowInitializationWarning = true;
}

/**
 * Configures the plugin. The plugin will inspect all environment variables passed in
 * {@link Cypress.PluginConfigOptions.env | `config.env`} and merge them with the ones provided in
 * `options`.
 *
 * Note: Environment variables always take precedence over values specified in `options`.
 *
 * Other Cypress configuration values which the plugin typically accesses are the Cypress version or
 * the project root directory.
 *
 * @param config - the Cypress configuration
 * @param options - the plugin options
 *
 * @see https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/uploadTestResults/#setup
 */
export async function configureXrayPlugin(
    config: Cypress.PluginConfigOptions,
    options: Options
): Promise<void> {
    canShowInitializationWarning = false;
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
    Requests.init({
        debug: internalOptions.plugin.debug,
        openSSL: internalOptions.openSSL,
    });
    setPluginContext({
        cypress: config,
        internal: internalOptions,
        clients: await initClients(internalOptions.jira, config.env),
    });
}

/**
 * Enables Cypress test results upload to Xray. This method will register several upload hooks under
 * the passed plugin events.
 *
 * @param on - the Cypress plugin events
 *
 * @see https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/uploadTestResults/
 */
export async function addXrayResultUpload(on: Cypress.PluginEvents): Promise<void> {
    on("before:run", async (runDetails: Cypress.BeforeRunDetails) => {
        const context = getPluginContext();
        if (!context) {
            if (canShowInitializationWarning) {
                logInitializationWarning("before:run");
            }
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
                if (canShowInitializationWarning) {
                    logInitializationWarning("after:run");
                }
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

/**
 * Attempts to synchronize the Cucumber feature file with Xray. If the filename does not end with
 * the configured {@link https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#featurefileextension | feature file extension},
 * this method does not upload anything to Xray.
 *
 * @param file - the Cypress file object
 * @returns the unmodified file's path
 */
export async function syncFeatureFile(file: Cypress.FileObject): Promise<string> {
    const context = getPluginContext();
    if (!context) {
        if (canShowInitializationWarning) {
            logInitializationWarning("file:preprocessor");
        }
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

function logInitializationWarning(hook: "before:run" | "after:run" | "file:preprocessor"): void {
    // Do not throw in case someone does not want the plugin to run but forgot to remove a hook.
    logWarning(
        dedent(`
            Skipping ${hook} hook: Plugin misconfigured: configureXrayPlugin() was not called

            Make sure your project is set up correctly: ${HELP.plugin.configuration.introduction}
        `)
    );
}
