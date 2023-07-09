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
import { logInfo } from "./src/logging/logging";
import { Options, PluginContext } from "./src/types/plugin";

let context: PluginContext;

export async function configureXrayPlugin(config: Cypress.PluginConfigOptions, options: Options) {
    const configOptions = mergeWithDefaults(options);
    const envOptions = parseEnvironmentVariables(config.env);
    context = {
        internal: mergeOptions(configOptions, envOptions),
        cypress: config,
    };

    if (!context.internal.plugin.enabled) {
        logInfo("Plugin disabled. Skipping configuration verification.");
        return;
    }
    verifyContext(context.internal);
    context.xrayClient = initXrayClient(context.internal, context.cypress.env);
    context.jiraClient = initJiraClient(context.internal, context.cypress.env);
    Requests.init(context.internal);
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
