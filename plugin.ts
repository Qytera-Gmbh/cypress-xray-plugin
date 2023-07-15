/// <reference types="cypress" />

import { initJiraClient, initOptions, initXrayClient, verifyOptions } from "./src/context";
import { afterRunHook, beforeRunHook, synchronizeFile } from "./src/hooks";
import { Requests } from "./src/https/requests";
import { initLogging, logInfo } from "./src/logging/logging";
import { Options, PluginContext } from "./src/types/plugin";

let context: PluginContext;

export async function configureXrayPlugin(config: Cypress.PluginConfigOptions, options: Options) {
    const internalOptions = initOptions(config.env, options);
    if (!internalOptions.plugin.enabled) {
        logInfo("Plugin disabled. Skipping configuration verification.");
        return;
    }
    verifyOptions(internalOptions);
    context = {
        internal: internalOptions,
        cypress: config,
        xrayClient: initXrayClient(internalOptions, config.env),
        jiraClient: initJiraClient(internalOptions, config.env),
    };
    Requests.init(internalOptions);
    initLogging({
        debug: internalOptions.plugin.debug,
        logDirectory: internalOptions.plugin.logDirectory,
    });
}

export async function addXrayResultUpload(on: Cypress.PluginEvents) {
    on("before:run", async (runDetails: Cypress.BeforeRunDetails) => {
        await beforeRunHook(
            context.cypress,
            runDetails,
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
            await afterRunHook(results, context.internal, context.xrayClient, context.jiraClient);
        }
    );
}

export async function syncFeatureFile(file: Cypress.FileObject): Promise<string> {
    return await synchronizeFile(
        file,
        context.cypress.projectRoot,
        context.internal,
        context.xrayClient
    );
}
