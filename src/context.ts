import { PluginContext } from "./types/xray/plugin";
import { Uploader } from "./uploader";

export let PLUGIN_CONTEXT: PluginContext = null;

export interface InitParameters {
    uploader: Uploader<any>;
    projectKey: string;
    testType?: string;
}

export function initContext({
    uploader,
    projectKey,
    testType = "Manual",
}: InitParameters) {
    PLUGIN_CONTEXT = {
        uploader: uploader,
        jira: {
            projectKey: projectKey,
        },
        xray: {
            testType: testType,
        },
        openSSL: {},
        config: {},
    };
}

export function setContext(context: PluginContext) {
    PLUGIN_CONTEXT = context;
}
