/**
 * Contains a mapping of all available options to their respective environment variable names.
 */
export const ENV_NAMES = {
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
            description: "JIRA_FIELDS_DESCRIPTION",
            labels: "JIRA_FIELDS_LABELS",
            summary: "JIRA_FIELDS_SUMMARY",
            testEnvironments: "JIRA_FIELDS_TEST_ENVIRONMENTS",
            testPlan: "JIRA_FIELDS_TEST_PLAN",
        },
        projectKey: "JIRA_PROJECT_KEY",
        testExecutionIssue: "JIRA_TEST_EXECUTION_ISSUE",
        testExecutionIssueDescription: "JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION",
        testExecutionIssueKey: "JIRA_TEST_EXECUTION_ISSUE_KEY",
        testExecutionIssueSummary: "JIRA_TEST_EXECUTION_ISSUE_SUMMARY",
        testExecutionIssueType: "JIRA_TEST_EXECUTION_ISSUE_TYPE",
        testPlanIssueKey: "JIRA_TEST_PLAN_ISSUE_KEY",
        testPlanIssueType: "JIRA_TEST_PLAN_ISSUE_TYPE",
        url: "JIRA_URL",
    },
    plugin: {
        debug: "PLUGIN_DEBUG",
        enabled: "PLUGIN_ENABLED",
        logDirectory: "PLUGIN_LOG_DIRECTORY",
        normalizeScreenshotNames: "PLUGIN_NORMALIZE_SCREENSHOT_NAMES",
        splitUpload: "PLUGIN_SPLIT_UPLOAD",
        uploadLastAttempt: "PLUGIN_UPLOAD_LAST_ATTEMPT",
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
        uploadRequests: "XRAY_UPLOAD_REQUESTS",
        uploadResults: "XRAY_UPLOAD_RESULTS",
        uploadScreenshots: "XRAY_UPLOAD_SCREENSHOTS",
        url: "XRAY_URL",
    },
} as const;
