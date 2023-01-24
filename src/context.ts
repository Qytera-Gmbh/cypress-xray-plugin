import { Client } from "./client/client";
import { PluginContext } from "./types/xray/plugin";

export let PLUGIN_CONTEXT: PluginContext = null;

export interface InitParameters {
    client: Client<any>;
    projectKey: string;
    testType?: string;
}

export function initContext({
    client,
    projectKey,
    testType = "Manual",
}: InitParameters) {
    PLUGIN_CONTEXT = {
        client: client,
        jira: {
            projectKey: projectKey,
        },
        xray: {
            testType: testType,
            uploadResults: true,
        },
        openSSL: {},
        config: {},
    };
}

export function setContext(context: PluginContext) {
    PLUGIN_CONTEXT = context;
}
