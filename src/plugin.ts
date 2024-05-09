import {
    PluginContext,
    getPluginContext,
    initClients,
    initCucumberOptions,
    initHttpClients,
    initJiraOptions,
    initPluginOptions,
    initXrayOptions,
    setPluginContext,
} from "./context";
import { afterRunHook, beforeRunHook } from "./hooks/hooks";
import { synchronizeFeatureFile } from "./hooks/preprocessor/synchronizeFeatureFile";
import { LOG, Level } from "./logging/logging";
import { InternalOptions, InternalPluginOptions, Options } from "./types/plugin";
import { dedent } from "./util/dedent";
import { HELP } from "./util/help";

let canShowInitializationWarning = true;

/**
 * Resets the plugin including its context.
 */
export function resetPlugin(): void {
    setPluginContext(undefined);
    canShowInitializationWarning = true;
}

export function showInitializationWarnings(): boolean {
    return canShowInitializationWarning;
}

/**
 * Configures the plugin. The plugin will check all environment variables passed in
 * {@link Cypress.PluginConfigOptions.env | `config.env`} and merge them with those specified in
 * `options`. Environment variables always override values specified in `options`.
 *
 * *Note: This method will register upload hooks under the Cypress `before:run` and `after:run`
 * events. Consider using [`cypress-on-fix`](https://github.com/bahmutov/cypress-on-fix) if you
 * have other hooks registered to prevent the plugin from replacing them.*
 *
 * @param on - the Cypress plugin events
 * @param config - the Cypress configuration
 * @param options - the plugin options
 *
 * @see https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/uploadTestResults/#setup
 */
export async function configureXrayPlugin(
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions,
    options: Options
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
    const internalOptions: InternalOptions = {
        jira: initJiraOptions(config.env, options.jira),
        plugin: pluginOptions,
        xray: initXrayOptions(config.env, options.xray),
        cucumber: await initCucumberOptions(config, options.cucumber),
        http: options.http,
    };
    const httpClients = initHttpClients(
        {
            debug: internalOptions.plugin.debug,
        },
        internalOptions.http
    );
    const clients = await initClients(internalOptions.jira, config.env, httpClients);
    const context = new PluginContext(clients, internalOptions, config);
    setPluginContext(context);
    if (internalOptions.xray.uploadResults) {
        on("before:run", async (runDetails: Cypress.BeforeRunDetails) => {
            if (!runDetails.specs) {
                LOG.message(
                    Level.WARNING,
                    "No specs about to be executed. Skipping before:run hook"
                );
                return;
            }
            await beforeRunHook(runDetails.specs, context.getOptions(), context.getClients());
        });
        on(
            "after:run",
            async (
                results:
                    | CypressCommandLine.CypressRunResult
                    | CypressCommandLine.CypressFailedRunResult
            ) => {
                // Cypress's status types are incomplete, there is also "finished".
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if ("status" in results && results.status === "failed") {
                    const failedResult = results;
                    LOG.message(
                        Level.ERROR,
                        dedent(`
                            Skipping after:run hook: Failed to run ${failedResult.failures.toString()} tests

                            ${failedResult.message}
                        `)
                    );
                    return;
                }
                await afterRunHook(
                    results as CypressCommandLine.CypressRunResult,
                    context.getOptions(),
                    context.getClients()
                );
            }
        );
    } else {
        LOG.message(Level.INFO, "Xray results upload disabled. No results will be uploaded");
    }
}

/**
 * Attempts to synchronize the Cucumber feature file with Xray. If the filename does not end with
 * the configured {@link https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#featurefileextension | feature file extension},
 * this method will not upload anything to Xray.
 *
 * @param file - the Cypress file object
 * @returns the unmodified file's path
 */
export async function syncFeatureFile(file: Cypress.FileObject): Promise<string> {
    const context = getPluginContext();
    if (!context) {
        if (showInitializationWarnings()) {
            logInitializationWarning("file:preprocessor");
        }
        return file.filePath;
    }
    if (!context.getOptions().plugin.enabled) {
        LOG.message(
            Level.INFO,
            `Plugin disabled. Skipping feature file synchronization triggered by: ${file.filePath}`
        );
        return file.filePath;
    }
    return await synchronizeFeatureFile(
        file,
        context.getCypressOptions().projectRoot,
        context.getOptions(),
        context.getClients()
    );
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
