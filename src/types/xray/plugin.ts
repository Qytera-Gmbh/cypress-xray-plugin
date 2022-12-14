import { Uploader } from "../../uploader";

export interface PluginContext {
    uploader: Uploader<any>;
    jira: JiraContext;
    xray: XrayContext;
    config: PluginOptions;
}

export interface JiraContext {
    projectKey: string;
    testExecutionKey?: string;
}

export interface XrayContext {
    testType: string;
}

export interface PluginOptions {
    overwriteIssueSummary?: boolean;
}
