import path from "path";
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
import { JiraSearchOptimisation } from "./hooks/optimisations/jira-search-optimisation";
import { addSynchronizationCommands } from "./hooks/preprocessor/file-preprocessor";
import { CypressFailedRunResultType, CypressRunResultType } from "./types/cypress/cypress";
import {
    CypressXrayPluginOptions,
    InternalCypressXrayPluginOptions,
    InternalPluginOptions,
} from "./types/plugin";
import { dedent } from "./util/dedent";
import { ExecutableGraph } from "./util/graph/executable-graph";
import { ChainingCommandGraphLogger } from "./util/graph/logging/graph-logger";
import { commandToDot, graphToDot } from "./util/graph/visualisation/dot";
import { HELP } from "./util/help";
import { CapturingLogger, LOG, Level } from "./util/logging";

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
        LOG.message(Level.INFO, "Plugin disabled. Skipping further configuration.");
        // Tasks must always be registered in case users forget to comment out imported commands.
        registerDefaultTasks(on);
        return;
    }
    // We should be using config.isInteractive here, but cannot currently because of a bug.
    // See: https://github.com/cypress-io/cypress/issues/20789
    if (!config.isTextTerminal) {
        pluginOptions.enabled = false;
        LOG.message(Level.INFO, "Interactive mode detected, disabling plugin.");
        // Tasks must always be registered in case users forget to comment out imported commands.
        registerDefaultTasks(on);
        return;
    }
    // Init logging before all other configurations because they might require an initialized
    // logging module.
    if (!path.isAbsolute(pluginOptions.logDirectory)) {
        // Cypress might change process.cwd(), so we need to query the root directory.
        // See: https://github.com/cypress-io/cypress/issues/22689
        pluginOptions.logDirectory = path.resolve(config.projectRoot, pluginOptions.logDirectory);
    }
    LOG.configure({
        debug: pluginOptions.debug,
        logDirectory: pluginOptions.logDirectory,
    });
    const internalOptions: InternalCypressXrayPluginOptions = {
        cucumber: await initCucumberOptions(config, options.cucumber),
        http: options.http,
        jira: initJiraOptions(config.env, options.jira),
        plugin: pluginOptions,
        xray: initXrayOptions(config.env, options.xray),
    };
    const httpClients = initHttpClients(internalOptions.plugin, internalOptions.http);
    const logger = new CapturingLogger();
    const context = new PluginContext(
        await initClients(internalOptions.jira, config.env, httpClients),
        internalOptions,
        config,
        new SimpleEvidenceCollection(),
        new ExecutableGraph(),
        logger
    );
    setPluginContext(context);
    const listener = new PluginTaskListener(internalOptions.jira.projectKey, context, logger);
    on("task", {
        [PluginTask.INCOMING_RESPONSE]: (
            args: PluginTaskParameterType[PluginTask.INCOMING_RESPONSE]
        ) => {
            if (internalOptions.xray.uploadRequests) {
                return listener[PluginTask.INCOMING_RESPONSE](args);
            }
            return args.response;
        },
        [PluginTask.OUTGOING_REQUEST]: (
            args: PluginTaskParameterType[PluginTask.OUTGOING_REQUEST]
        ) => {
            if (internalOptions.xray.uploadRequests) {
                return listener[PluginTask.OUTGOING_REQUEST](args);
            }
            return args.request;
        },
    });
    on("after:run", async (results: CypressFailedRunResultType | CypressRunResultType) => {
        if (context.getOptions().xray.uploadResults) {
            if ("status" in results && results.status === "failed") {
                const failedResult = results;
                LOG.message(
                    Level.ERROR,
                    dedent(`
                        Skipping results upload: Failed to run ${failedResult.failures.toString()} tests.

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
                    logger
                );
            }
        } else {
            LOG.message(
                Level.INFO,
                "Skipping results upload: Plugin is configured to not upload test results."
            );
        }
        const optimisations = [new JiraSearchOptimisation(context.getGraph())];
        try {
            await exportGraph(context.getGraph(), Level.INFO, "before_opt_");
            await Promise.all(optimisations.map((optimisation) => optimisation.optimise()));
            await exportGraph(context.getGraph(), Level.INFO, "after_opt_");
            // await context.getGraph().execute();
        } finally {
            new ChainingCommandGraphLogger(logger).logGraph(context.getGraph());
            const messages = logger.getMessages();
            messages.forEach(([level, text]) => {
                if ([Level.DEBUG, Level.INFO, Level.SUCCESS].includes(level)) {
                    LOG.message(level, text);
                }
            });
            if (messages.some(([level]) => level === Level.WARNING || level === Level.ERROR)) {
                LOG.message(Level.WARNING, "Encountered problems during plugin execution!");
                messages
                    .filter(([level]) => level === Level.WARNING)
                    .forEach(([level, text]) => {
                        LOG.message(level, text);
                    });
                messages
                    .filter(([level]) => level === Level.ERROR)
                    .forEach(([level, text]) => {
                        LOG.message(level, text);
                    });
            }
            logger.getFileLogErrorMessages().forEach(([error, filename]) => {
                LOG.logErrorToFile(error, filename);
            });
            logger.getFileLogMessages().forEach(([data, filename]) => {
                LOG.logToFile(data, filename);
            });
            await exportGraph(context.getGraph(), Level.INFO, "result_");
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
                    ${file.filePath}

                      Skipping file:preprocessor hook: Plugin misconfigured: configureXrayPlugin() was not called.

                      Make sure your project is set up correctly: ${HELP.plugin.configuration.introduction}
                `)
            );
        }
        return file.filePath;
    }
    if (!context.getOptions().plugin.enabled) {
        LOG.message(
            Level.INFO,
            dedent(`
                ${file.filePath}

                  Plugin disabled. Skipping feature file synchronization.
            `)
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
            context.getOptions(),
            context.getClients(),
            context.getGraph(),
            context.getLogger()
        );
    }
    return file.filePath;
}

function registerDefaultTasks(on: Cypress.PluginEvents) {
    on("task", {
        [PluginTask.INCOMING_RESPONSE]: (
            args: PluginTaskParameterType[PluginTask.INCOMING_RESPONSE]
        ) => args.response,
        [PluginTask.OUTGOING_REQUEST]: (
            args: PluginTaskParameterType[PluginTask.OUTGOING_REQUEST]
        ) => args.request,
    });
}
async function exportGraph<V extends Command>(
    graph: ExecutableGraph<V>,
    level: Level,
    prefix?: string
): Promise<void> {
    const executionGraphFile = LOG.logToFile(
        await graphToDot(graph, commandToDot, (edge) =>
            graph.isOptional(edge) ? "dashed" : "bold"
        ),
        `${prefix ?? ""}execution-graph.vz`
    );
    LOG.message(
        level,
        dedent(`
            Plugin execution graph saved to: ${prefix ?? ""}${executionGraphFile}

            You can view it using Graphviz (https://graphviz.org/):

              dot -o ${prefix ?? ""}execution-graph.pdf -Tpdf ${prefix ?? ""}${executionGraphFile}

            Alternatively, you can view it online under any of the following websites:
            - https://dreampuf.github.io/GraphvizOnline
            - https://edotor.net/
        `)
    );
}
