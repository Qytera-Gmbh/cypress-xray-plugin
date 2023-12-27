import {
    clearPluginContext,
    getPluginContext,
    initClients,
    initCucumberOptions,
    initJiraOptions,
    initPluginOptions,
    initSslOptions,
    initXrayOptions,
    setPluginContext,
} from "./context";
import { onAfterRun } from "./hooks/after/afterRun";
import { beforeRunHook } from "./hooks/hooks";
import { synchronizeFeatureFile } from "./hooks/preprocessor/synchronizeFeatureFile";
import { REST } from "./https/requests";
import { LOG, Level } from "./logging/logging";
import {
    CypressXrayPluginOptions,
    InternalCypressXrayPluginOptions,
    InternalPluginOptions,
} from "./types/plugin";
import { dedent } from "./util/dedent";
import { ExecutableGraph } from "./util/executable/executable";
import { HELP } from "./util/help";

let canShowInitializationWarning = true;

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
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions,
    options: CypressXrayPluginOptions
): Promise<void> {
    canShowInitializationWarning = false;
    // Resolve these before all other options for correct enabledness.
    const pluginOptions: InternalPluginOptions = initPluginOptions(config.env, options.plugin);
    if (!pluginOptions.enabled) {
        LOG.message(Level.INFO, "Plugin disabled. Skipping further configuration");
        return;
    }
    // Init logging before all other configurations because they might require an initialized
    // logging module.
    LOG.configure({
        debug: pluginOptions.debug,
        logDirectory: pluginOptions.logDirectory,
    });
    const internalOptions: InternalCypressXrayPluginOptions = {
        jira: initJiraOptions(config.env, options.jira),
        plugin: pluginOptions,
        xray: initXrayOptions(config.env, options.xray),
        cucumber: await initCucumberOptions(config, options.cucumber),
        ssl: initSslOptions(config.env, options.openSSL),
    };
    REST.init({
        debug: internalOptions.plugin.debug,
        ssl: internalOptions.ssl,
    });
    setPluginContext({
        cypress: config,
        options: internalOptions,
        clients: await initClients(internalOptions.jira, config.env),
        graph: new ExecutableGraph(),
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
            await onAfterRun(results, context);
        }
    );
}

/**
 * Enables Cypress test results upload to Xray. This method will register several upload hooks under
 * the passed plugin events.
 *
 * @param on - the Cypress plugin events
 *
 * @see https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/uploadTestResults/
 */
export function addXrayResultUpload(on: Cypress.PluginEvents): void {
    on("before:run", async (runDetails: Cypress.BeforeRunDetails) => {
        const context = getPluginContext();
        if (!context) {
            if (canShowInitializationWarning) {
                logInitializationWarning("before:run");
            }
            return;
        }
        if (!context.options.plugin.enabled) {
            LOG.message(Level.INFO, "Plugin disabled. Skipping before:run hook");
            return;
        }
        if (!runDetails.specs) {
            LOG.message(Level.WARNING, "No specs about to be executed. Skipping before:run hook");
            return;
        }
        await beforeRunHook(runDetails.specs, context.options, context.clients);
    });
}

/**
 * Attempts to synchronize the Cucumber feature file with Xray. If the filename does not end with
 * the configured {@link https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#featurefileextension | feature file extension},
 * this method does not upload anything to Xray.
 *
 * @param file - the Cypress file object
 * @returns the unmodified file's path
 */
export function syncFeatureFile(file: Cypress.FileObject): string {
    const context = getPluginContext();
    if (!context) {
        if (canShowInitializationWarning) {
            logInitializationWarning("file:preprocessor");
        }
        return file.filePath;
    }
    if (!context.options.plugin.enabled) {
        LOG.message(
            Level.INFO,
            `Plugin disabled. Skipping feature file synchronization triggered by: ${file.filePath}`
        );
        return file.filePath;
    }
    if (
        context.options.cucumber &&
        file.filePath.endsWith(context.options.cucumber.featureFileExtension) &&
        context.options.cucumber.uploadFeatures
    ) {
        synchronizeFeatureFile(
            file,
            context.cypress.projectRoot,
            context.options,
            context.clients,
            context.graph
        );
    }
    return file.filePath;
}

function logInitializationWarning(hook: "before:run" | "after:run" | "file:preprocessor"): void {
    // Do not throw in case someone does not want the plugin to run but forgot to remove a hook.
    LOG.message(
        Level.WARNING,
        dedent(`
            Skipping ${hook} hook: Plugin misconfigured: configureXrayPlugin() was not called

            Make sure your project is set up correctly: ${HELP.plugin.configuration.introduction}
        `)
    );
}
