import { Uploader } from "../../uploader";

export interface PluginContext {
    uploader: Uploader<any>;
    jira: JiraContext;
    xray: XrayContext;
    config: PluginOptions;
    openSSL: OpenSSLContext;
}

export interface JiraContext {
    projectKey: string;
    testExecutionKey?: string;
}

export interface XrayContext {
    testType: string;
    statusPassed?: string;
    statusFailed?: string;
}

export interface PluginOptions {
    overwriteIssueSummary?: boolean;
    normalizeScreenshotNames?: boolean;
}

export interface OpenSSLContext {
    rootCA?: string;
    secureOptions?: number;
}
