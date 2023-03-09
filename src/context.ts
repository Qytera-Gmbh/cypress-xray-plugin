import {
    CucumberOptions,
    JiraOptions,
    OpenSSLOptions,
    Options,
    PluginContext,
    PluginOptions,
    XrayOptions,
} from "./types/xray/plugin";

export let CONTEXT: PluginContext = null;

export function initContext(config: Options) {
    CONTEXT = {
        config: {
            jira: { ...DEFAULT_OPTIONS_JIRA, ...config.jira },
            plugin: { ...DEFAULT_OPTIONS_PLUGIN, ...config.plugin },
            xray: { ...DEFAULT_OPTIONS_Xray, ...config.xray },
            cucumber: { ...DEFAULT_OPTIONS_CUCUMBER, ...config.cucumber },
            openSSL: { ...DEFAULT_OPTIONS_OPEN_SSL, ...config.openSSL },
        },
    };
}

// Set some default values.

const DEFAULT_OPTIONS_JIRA: JiraOptions = {
    projectKey: null,
};
const DEFAULT_OPTIONS_PLUGIN: PluginOptions = {
    overwriteIssueSummary: false,
    normalizeScreenshotNames: false,
};

const DEFAULT_OPTIONS_Xray: XrayOptions = {
    uploadResults: true,
    statusPassed: "PASSED",
    statusFailed: "FAILED",
    testType: "Manual",
};

const DEFAULT_OPTIONS_CUCUMBER: CucumberOptions = {
    featureFileExtension: ".feature",
    uploadFeatures: false,
    downloadFeatures: false,
};

const DEFAULT_OPTIONS_OPEN_SSL: OpenSSLOptions = {};
