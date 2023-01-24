import { Client } from "../../client/client";

export interface PluginContext {
    client: Client<any>;
    jira: JiraContext;
    xray: XrayContext;
    cucumber: CucumberContext;
    config: PluginOptions;
    openSSL: OpenSSLContext;
}

export interface JiraContext {
    projectKey: string;
    testExecutionKey?: string;
}

export interface XrayContext {
    testType: string;
    uploadResults: boolean;
    statusPassed?: string;
    statusFailed?: string;
}

export interface CucumberContext {
    uploadFeatures?: boolean;
    downloadFeatures?: boolean;
}

export interface PluginOptions {
    overwriteIssueSummary?: boolean;
    normalizeScreenshotNames?: boolean;
}

export interface OpenSSLContext {
    rootCA?: string;
    secureOptions?: number;
}
