import path from "path";
import globalContext, {
    PluginContext,
    SimpleEvidenceCollection,
    SimpleIterationParameterCollection,
    SimpleScreenshotCollection,
} from "./context";
import type { PluginTaskParameterType } from "./cypress/tasks";
import { CypressTaskListener } from "./cypress/tasks";
import afterRun from "./hooks/after/after-run";
import filePreprocessor from "./hooks/preprocessor/file-preprocessor";
import type { CypressFailedRunResult, CypressRunResult } from "./types/cypress";
import type {
    CypressXrayPluginOptions,
    InternalCypressXrayPluginOptions,
    InternalPluginOptions,
} from "./types/plugin";
import { dedent } from "./util/dedent";
import { ExecutableGraph } from "./util/graph/executable-graph";
import { ChainingCommandGraphLogger } from "./util/graph/logging/graph-logger";
import { HELP } from "./util/help";
import { CapturingLogger, LOG } from "./util/logging";

let canShowInitializationWarning = true;

/**
 * Resets the plugin including its context.
 */
export function resetPlugin(): void {
    globalContext.setGlobalContext(undefined);
    canShowInitializationWarning = true;
}

/**
 * Configures the plugin. The plugin will check all environment variables passed in
 * {@link Cypress.PluginConfigOptions.env | `config.env`} and merge them with those specified in
 * `options`. Environment variables always override values specified in `options`.
 *
 * Note: This method will register upload hooks under the following Cypress events:
 *   - `after:run`
 *   - `on:screenshot`
 *   - `task`
 *
 * Consider using [`cypress-on-fix`](https://github.com/bahmutov/cypress-on-fix) if you have these
 * hooks registered to prevent the plugin from replacing them.
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
    const pluginOptions: InternalPluginOptions = globalContext.initPluginOptions(
        config.env,
        options.plugin
    );
    if (!pluginOptions.enabled) {
        LOG.message("info", "Plugin disabled. Skipping further configuration.");
        // Tasks must always be registered in case users forget to comment out imported commands.
        registerDefaultTasks(on);
        return;
    }
    // We should be using config.isInteractive here, but cannot currently because of a bug.
    // See: https://github.com/cypress-io/cypress/issues/20789
    if (!config.isTextTerminal) {
        pluginOptions.enabled = false;
        LOG.message("info", "Interactive mode detected, disabling plugin.");
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
        logger: pluginOptions.logger,
    });
    const internalOptions: InternalCypressXrayPluginOptions = {
        cucumber: await globalContext.initCucumberOptions(config, options.cucumber),
        http: options.http,
        jira: globalContext.initJiraOptions(config.env, options.jira),
        plugin: pluginOptions,
        xray: globalContext.initXrayOptions(config.env, options.xray),
    };
    const httpClients = globalContext.initHttpClients(internalOptions.plugin, internalOptions.http);
    const logger = new CapturingLogger();
    const context = new PluginContext(
        await globalContext.initClients(
            internalOptions.jira,
            internalOptions.xray,
            config.env,
            httpClients
        ),
        internalOptions,
        config,
        new SimpleEvidenceCollection(),
        new SimpleIterationParameterCollection(),
        new SimpleScreenshotCollection(),
        new ExecutableGraph(),
        logger
    );
    globalContext.setGlobalContext(context);
    const cypressTaskListener = new CypressTaskListener(
        internalOptions.jira.projectKey,
        context,
        context,
        logger
    );
    if (options.plugin?.listener) {
        await options.plugin.listener({
            on: context.getEventEmitter().on.bind(context.getEventEmitter()),
        });
    }
    on("task", {
        ["cypress-xray-plugin:task:iteration:definition"]: (
            args: PluginTaskParameterType["cypress-xray-plugin:task:iteration:definition"]
        ) => {
            return cypressTaskListener["cypress-xray-plugin:task:iteration:definition"](args);
        },
        ["cypress-xray-plugin:task:request"]: (
            args: PluginTaskParameterType["cypress-xray-plugin:task:request"]
        ) => {
            if (internalOptions.xray.uploadRequests) {
                return cypressTaskListener["cypress-xray-plugin:task:request"](args);
            }
            return args.request;
        },
        ["cypress-xray-plugin:task:response"]: (
            args: PluginTaskParameterType["cypress-xray-plugin:task:response"]
        ) => {
            if (internalOptions.xray.uploadRequests) {
                return cypressTaskListener["cypress-xray-plugin:task:response"](args);
            }
            return args.response;
        },
    });
    on("after:screenshot", (screenshot) => {
        context.addScreenshot(screenshot);
    });
    on("after:run", async (results: CypressFailedRunResult | CypressRunResult) => {
        if (context.getOptions().xray.uploadResults) {
            if ("status" in results && results.status === "failed") {
                const failedResult = results;
                LOG.message(
                    "error",
                    dedent(`
                        Skipping results upload: Failed to run ${failedResult.failures.toString()} tests.

                          ${failedResult.message}
                    `)
                );
            } else {
                await afterRun.addUploadCommands(
                    results,
                    context.getCypressOptions().projectRoot,
                    context.getOptions(),
                    context.getClients(),
                    context,
                    context,
                    context,
                    context.getEventEmitter(),
                    context.getGraph(),
                    logger
                );
            }
        } else {
            LOG.message(
                "info",
                "Skipping results upload: Plugin is configured to not upload test results."
            );
        }
        try {
            await context.getGraph().execute();
        } finally {
            new ChainingCommandGraphLogger(logger).logGraph(context.getGraph());
            const messages = logger.getMessages();
            messages.forEach(([level, text]) => {
                if (["debug", "info", "notice"].includes(level)) {
                    LOG.message(level, text);
                }
            });
            if (messages.some(([level]) => level === "warning" || level === "error")) {
                LOG.message("warning", "Encountered problems during plugin execution!");
                messages
                    .filter(([level]) => level === "warning")
                    .forEach(([level, text]) => {
                        LOG.message(level, text);
                    });
                messages
                    .filter(([level]) => level === "error")
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
    const context = globalContext.getGlobalContext();
    if (!context) {
        if (canShowInitializationWarning) {
            LOG.message(
                "warning",
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
            "info",
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
        filePreprocessor.addSynchronizationCommands(
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
        ["cypress-xray-plugin:task:iteration:definition"]: (
            args: PluginTaskParameterType["cypress-xray-plugin:task:iteration:definition"]
        ) => args.parameters,
        ["cypress-xray-plugin:task:request"]: (
            args: PluginTaskParameterType["cypress-xray-plugin:task:request"]
        ) => args.request,
        ["cypress-xray-plugin:task:response"]: (
            args: PluginTaskParameterType["cypress-xray-plugin:task:response"]
        ) => args.response,
    });
}
