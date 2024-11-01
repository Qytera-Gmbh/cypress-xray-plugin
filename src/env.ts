import type { CypressXrayPluginOptions } from "./types/plugin";
import type { Remap } from "./types/util";

/**
 * An interface containing all authentication options which can be provided via environment
 * variables.
 */
interface Authentication {
    authentication: {
        jira: {
            apiToken: string;
            password: string;
            username: string;
        };
        xray: {
            clientId: string;
            clientSecret: string;
        };
    };
}

/**
 * Contains a mapping of all available options to their respective environment variable names.
 */
export const ENV_NAMES: Remap<
    Omit<CypressXrayPluginOptions, "http"> & Authentication,
    string,
    ["testExecutionIssue"]
> = {
    authentication: {
        jira: {
            apiToken: "JIRA_API_TOKEN",
            password: "JIRA_PASSWORD",
            username: "JIRA_USERNAME",
        },
        xray: {
            clientId: "XRAY_CLIENT_ID",
            clientSecret: "XRAY_CLIENT_SECRET",
        },
    },
    cucumber: {
        downloadFeatures: "CUCUMBER_DOWNLOAD_FEATURES",
        featureFileExtension: "CUCUMBER_FEATURE_FILE_EXTENSION",
        prefixes: {
            precondition: "CUCUMBER_PREFIXES_PRECONDITION",
            test: "CUCUMBER_PREFIXES_TEST",
        },
        uploadFeatures: "CUCUMBER_UPLOAD_FEATURES",
    },
    jira: {
        attachVideos: "JIRA_ATTACH_VIDEOS",
        fields: {
            testEnvironments: "JIRA_FIELDS_TEST_ENVIRONMENTS",
            testPlan: "JIRA_FIELDS_TEST_PLAN",
        },
        projectKey: "JIRA_PROJECT_KEY",
        testExecutionIssue: "JIRA_TEST_EXECUTION_ISSUE",
        testPlanIssueKey: "JIRA_TEST_PLAN_ISSUE_KEY",
        url: "JIRA_URL",
    },
    plugin: {
        debug: "PLUGIN_DEBUG",
        enabled: "PLUGIN_ENABLED",
        logDirectory: "PLUGIN_LOG_DIRECTORY",
        normalizeScreenshotNames: "PLUGIN_NORMALIZE_SCREENSHOT_NAMES",
    },
    xray: {
        status: {
            failed: "XRAY_STATUS_FAILED",
            passed: "XRAY_STATUS_PASSED",
            pending: "XRAY_STATUS_PENDING",
            skipped: "XRAY_STATUS_SKIPPED",
            step: {
                failed: "XRAY_STATUS_STEP_FAILED",
                passed: "XRAY_STATUS_STEP_PASSED",
                pending: "XRAY_STATUS_STEP_PENDING",
                skipped: "XRAY_STATUS_STEP_SKIPPED",
            },
        },
        testEnvironments: "XRAY_TEST_ENVIRONMENTS",
        uploadResults: "XRAY_UPLOAD_RESULTS",
        uploadScreenshots: "XRAY_UPLOAD_SCREENSHOTS",
    },
};
