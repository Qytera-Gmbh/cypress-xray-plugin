import { Options, PluginContext } from "./types/plugin";

export let CONTEXT: PluginContext = null;

export function initContext(config: Options) {
    // Set some default values for constant options.
    CONTEXT = {
        config: {
            jira: {
                projectKey: config.jira?.projectKey,
                attachVideos: config.jira?.attachVideos || false,
                createTestIssues: config.jira?.createTestIssues || true,
                testExecutionIssueDescription: config.jira?.testExecutionIssueDescription,
                testExecutionIssueKey: config.jira?.testExecutionIssueKey,
                testExecutionIssueSummary: config.jira?.testExecutionIssueSummary,
                testPlanIssueKey: config.jira?.testPlanIssueKey,
                url: config.jira?.url,
            },
            plugin: {
                overwriteIssueSummary: config.plugin?.overwriteIssueSummary || false,
                normalizeScreenshotNames: config.plugin?.normalizeScreenshotNames || false,
                debug: config.plugin?.debug || false,
            },
            xray: {
                statusFailed: config.xray?.statusFailed,
                statusPassed: config.xray?.statusPassed,
                statusPending: config.xray?.statusPending,
                steps: {
                    maxLengthAction: config.xray?.steps?.maxLengthAction || 8000,
                    update: config.xray?.steps?.update || true,
                },
                testType: config.xray?.testType || "Manual",
                uploadResults: config.xray?.uploadResults || true,
                uploadScreenshots: config.xray?.uploadScreenshots || true,
            },
            cucumber: {
                featureFileExtension: config.cucumber?.featureFileExtension,
                downloadFeatures: config.cucumber?.downloadFeatures || false,
                issues: undefined,
                uploadFeatures: config.cucumber?.uploadFeatures || false,
            },
            openSSL: {
                rootCAPath: config.openSSL?.rootCAPath,
                secureOptions: config.openSSL?.secureOptions,
            },
        },
    };
}
