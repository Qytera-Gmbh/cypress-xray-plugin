import { REST } from "./client/https/requests";
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
import { addUploadCommands } from "./hooks/after/after-run";
import { addSynchronizationCommands } from "./hooks/preprocessor/file-preprocessor";
import { CypressFailedRunResultType, CypressRunResultType } from "./types/cypress/run-result";
import {
    CypressXrayPluginOptions,
    InternalCypressXrayPluginOptions,
    InternalPluginOptions,
    PluginContext,
} from "./types/plugin";
import { dedent } from "./util/dedent";
import { ExecutableGraph } from "./util/graph/executable";
import { commandToDot, graphToDot } from "./util/graph/visualisation/dot";
import { HELP } from "./util/help";
import { LOG, Level } from "./util/logging";

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
 * @param on - the Cypress event registration functon
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
    const context: PluginContext = {
        cypress: config,
        options: internalOptions,
        clients: await initClients(internalOptions.jira, config.env),
        graph: new ExecutableGraph(),
    };
    setPluginContext(context);
    on("after:run", async (results: CypressRunResultType | CypressFailedRunResultType) => {
        if (context.options.xray.uploadResults) {
            // Cypress's status types are incomplete, there is also "finished".
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if ("status" in results && results.status === "failed") {
                const failedResult = results;
                LOG.message(
                    Level.ERROR,
                    dedent(`
                        Skipping results upload: Failed to run ${failedResult.failures} tests

                        ${failedResult.message}
                    `)
                );
            } else {
                addUploadCommands(
                    results as CypressRunResultType,
                    context.cypress.projectRoot,
                    context.options,
                    context.clients,
                    context.graph
                );
            }
        } else {
            LOG.message(
                Level.INFO,
                "Skipping results upload: Plugin is configured to not upload test results"
            );
        }
        try {
            await context.graph.execute();
        } finally {
            if (context.options.plugin.debug) {
                const executionGraphFile = LOG.logToFile(
                    await graphToDot(context.graph, commandToDot),
                    "execution-graph.vz"
                );
                LOG.message(
                    Level.DEBUG,
                    dedent(`
                            Plugin execution graph saved to: ${executionGraphFile}

                            You can view it using Graphviz (https://graphviz.org/):

                              dot -o execution-graph.svg -Tsvg ${executionGraphFile}

                            Alternatively, you can view it online under any of the following websites:
                            - https://dreampuf.github.io/GraphvizOnline
                            - https://edotor.net/
                            - https://www.devtoolsdaily.com/graphviz/
                        `)
                );
            }
        }
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
            LOG.message(
                Level.WARNING,
                dedent(`
                    Skipping file:preprocessor hook: Plugin misconfigured: configureXrayPlugin() was not called

                    Make sure your project is set up correctly: ${HELP.plugin.configuration.introduction}
                `)
            );
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
        addSynchronizationCommands(
            file,
            context.cypress.projectRoot,
            context.options,
            context.clients,
            context.graph
        );
    }
    return file.filePath;
}
