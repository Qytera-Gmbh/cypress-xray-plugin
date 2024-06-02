import {
    PluginContext,
    SimpleEvidenceCollection,
    getPluginContext,
    initClients,
    initCucumberOptions,
    initHttpClients,
    initJiraOptions,
    initPluginOptions,
    initXrayOptions,
    setPluginContext,
} from "./context";
import { PluginTask, PluginTaskListener, PluginTaskParameterType } from "./cypress/tasks";
import { addUploadCommands } from "./hooks/after/after-run";
import { Command } from "./hooks/command";
import { addSynchronizationCommands } from "./hooks/preprocessor/file-preprocessor";
import { CypressFailedRunResultType, CypressRunResultType } from "./types/cypress/cypress";
import {
    CypressXrayPluginOptions,
    InternalCypressXrayPluginOptions,
    InternalPluginOptions,
} from "./types/plugin";
import { dedent } from "./util/dedent";
import { ExecutableGraph } from "./util/graph/executable-graph";
import { commandToDot, graphToDot } from "./util/graph/visualisation/dot";
import { HELP } from "./util/help";
import { LOG, Level } from "./util/logging";

let canShowInitializationWarning = true;

/**
 * Resets the plugin including its context.
 */
export function resetPlugin(): void {
    setPluginContext(undefined);
    canShowInitializationWarning = true;
}

/**
 * Configures the plugin. The plugin will check all environment variables passed in
 * {@link Cypress.PluginConfigOptions.env | `config.env`} and merge them with those specified in
 * `options`. Environment variables always override values specified in `options`.
 *
 * *Note: This method will register upload hooks under the Cypress `before:run`, `after:run` and
 * `task` events. Consider using [`cypress-on-fix`](https://github.com/bahmutov/cypress-on-fix) if
 * you have these hooks registered to prevent the plugin from replacing them.*
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
        http: options.http,
    };
    const httpClients = initHttpClients(internalOptions.plugin, internalOptions.http);
    const context = new PluginContext(
        await initClients(internalOptions.jira, config.env, httpClients),
        internalOptions,
        config,
        new SimpleEvidenceCollection(),
        new ExecutableGraph()
    );
    setPluginContext(context);
    const listener = new PluginTaskListener(internalOptions.jira.projectKey, context);
    on("task", {
        [PluginTask.OUTGOING_REQUEST]: (
            args: PluginTaskParameterType[PluginTask.OUTGOING_REQUEST]
        ) => {
            if (internalOptions.xray.uploadRequests) {
                return listener[PluginTask.OUTGOING_REQUEST](args);
            }
            return args.request;
        },
        [PluginTask.INCOMING_RESPONSE]: (
            args: PluginTaskParameterType[PluginTask.INCOMING_RESPONSE]
        ) => {
            if (internalOptions.xray.uploadRequests) {
                return listener[PluginTask.INCOMING_RESPONSE](args);
            }
            return args.response;
        },
    });
    on("after:run", async (results: CypressRunResultType | CypressFailedRunResultType) => {
        if (context.getOptions().xray.uploadResults) {
            // Cypress's status types are incomplete, there is also "finished".
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if ("status" in results && results.status === "failed") {
                const failedResult = results;
                LOG.message(
                    Level.ERROR,
                    dedent(`
                        Skipping results upload: Failed to run ${failedResult.failures.toString()} tests

                        ${failedResult.message}
                    `)
                );
            } else {
                addUploadCommands(
                    results,
                    context.getCypressOptions().projectRoot,
                    context.getOptions(),
                    context.getClients(),
                    context,
                    context.getGraph(),
                    LOG
                );
            }
        } else {
            LOG.message(
                Level.INFO,
                "Skipping results upload: Plugin is configured to not upload test results"
            );
        }
        try {
            await context.getGraph().execute();
        } finally {
            if (context.getGraph().hasFailedVertices()) {
                await exportGraph(
                    context.getGraph(),
                    Level.WARNING,
                    "Failed to execute some steps during plugin execution"
                );
            } else if (options.plugin?.debug) {
                await exportGraph(context.getGraph(), Level.DEBUG);
            }
        }
    });
}

/**
 * Attempts to synchronize the Cucumber feature file with Xray. If the filename does not end with
 * the configured {@link https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#featurefileextension | feature file extension},
 * this method will not upload anything to Xray.
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
    if (!context.getOptions().plugin.enabled) {
        LOG.message(
            Level.INFO,
            `Plugin disabled. Skipping feature file synchronization triggered by: ${file.filePath}`
        );
        return file.filePath;
    }
    const cucumberOptions = context.getOptions().cucumber;
    if (
        cucumberOptions &&
        file.filePath.endsWith(cucumberOptions.featureFileExtension) &&
        cucumberOptions.uploadFeatures
    ) {
        addSynchronizationCommands(
            file,
            context.getCypressOptions().projectRoot,
            context.getOptions(),
            context.getClients(),
            context.getGraph(),
            LOG
        );
    }
    return file.filePath;
}

async function exportGraph<V extends Command>(
    graph: ExecutableGraph<V>,
    level: Level,
    prefix?: string
): Promise<void> {
    const dotGraph = await graphToDot(graph, commandToDot, (edge) =>
        graph.isOptional(edge) ? "dashed" : "bold"
    );
    const executionGraphFile = LOG.logToFile(dotGraph, "execution-graph.vz");
    LOG.message(
        level,
        dedent(`
            ${prefix ? `${prefix}\n\n` : ""}Plugin execution graph saved to: ${executionGraphFile}

            You can view it using Graphviz (https://graphviz.org/):

              dot -o execution-graph.pdf -Tpdf ${executionGraphFile}

            Alternatively, you can view it online under any of the following websites:
            - https://dreampuf.github.io/GraphvizOnline
            - https://edotor.net/
        `)
    );
}
