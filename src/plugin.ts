/// <reference types="cypress" />

import { initJiraClient, initOptions, initXrayClient, verifyContext } from "./context";
import { afterRunHook, synchronizeFile } from "./hooks";
import { Requests } from "./https/requests";
import { logInfo } from "./logging/logging";
import { Options, PluginContext } from "./types/plugin";

let context: PluginContext;

export async function configureXrayPlugin(config: Cypress.PluginConfigOptions, options: Options) {
    context = {
        internal: initOptions(config.env, options),
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
