/// <reference types="cypress" />

import {
    initJiraClient,
    initXrayClient,
    mergeOptions,
    initOptions as mergeWithDefaults,
    parseEnvironmentVariables,
    verifyContext,
} from "./src/context";
import { afterRunHook, beforeRunHook, synchronizeFile } from "./src/hooks";
import { Requests } from "./src/https/requests";
import { initLogging, logInfo } from "./src/logging/logging";
import { Options, PluginContext } from "./src/types/plugin";

let context: PluginContext;

export async function configureXrayPlugin(config: Cypress.PluginConfigOptions, options: Options) {
    const configOptions = mergeWithDefaults(options);
    const envOptions = parseEnvironmentVariables(config.env);
    const mergedOptions = mergeOptions(configOptions, envOptions);
    if (!mergedOptions.plugin.enabled) {
        logInfo("Plugin disabled. Skipping configuration verification.");
        return;
    }
    verifyContext(mergedOptions);
    context = {
        internal: mergedOptions,
        cypress: config,
        xrayClient: initXrayClient(mergedOptions, config.env),
        jiraClient: initJiraClient(mergedOptions, config.env),
    };
    Requests.init(mergedOptions);
    initLogging({ debug: mergedOptions.plugin.debug });
}

export async function addXrayResultUpload(on: Cypress.PluginEvents) {
    on("before:run", async (runDetails: Cypress.BeforeRunDetails) => {
        await beforeRunHook(runDetails, context.internal, context.xrayClient, context.jiraClient);
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
