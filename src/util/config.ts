import { Client } from "../client/client";
import { CloudClient } from "../client/cloudClient";
import { ServerClient } from "../client/serverClient";
import {
    ENV_CUCUMBER_DOWNLOAD_FEATURES,
    ENV_CUCUMBER_FEATURE_FILE_EXTENSION,
    ENV_CUCUMBER_UPLOAD_FEATURES,
    ENV_JIRA_ATTACH_VIDEO,
    ENV_JIRA_PROJECT_KEY,
    ENV_JIRA_SERVER_URL,
    ENV_JIRA_TEST_EXECUTION_ISSUE_KEY,
    ENV_JIRA_TEST_PLAN_ISSUE_KEY,
    ENV_OPENSSL_ROOT_CA_PATH,
    ENV_OPENSSL_SECURE_OPTIONS,
    ENV_PLUGIN_NORMALIZE_SCREENSHOT_NAMES,
    ENV_PLUGIN_OVERWRITE_ISSUE_SUMMARY,
    ENV_XRAY_API_TOKEN,
    ENV_XRAY_CLIENT_ID,
    ENV_XRAY_CLIENT_SECRET,
    ENV_XRAY_PASSWORD,
    ENV_XRAY_STATUS_FAILED,
    ENV_XRAY_STATUS_PASSED,
    ENV_XRAY_UPLOAD_RESULTS,
    ENV_XRAY_UPLOAD_SCREENSHOTS,
    ENV_XRAY_USERNAME,
} from "../constants";
import { CONTEXT } from "../context";
import {
    BasicAuthCredentials,
    JWTCredentials,
    PATCredentials,
} from "../credentials";
import { parseBoolean } from "./parsing";

export function parseEnvironmentVariables(env: Cypress.ObjectLike): void {
    // Jira.
    if (ENV_JIRA_PROJECT_KEY in env) {
        CONTEXT.config.jira.projectKey = env[ENV_JIRA_PROJECT_KEY];
    }
    if (ENV_JIRA_SERVER_URL in env) {
        CONTEXT.config.jira.serverUrl = env[ENV_JIRA_SERVER_URL];
    }
    if (ENV_JIRA_TEST_EXECUTION_ISSUE_KEY in env) {
        CONTEXT.config.jira.testExecutionIssueKey =
            env[ENV_JIRA_TEST_EXECUTION_ISSUE_KEY];
    }
    if (ENV_JIRA_TEST_PLAN_ISSUE_KEY in env) {
        CONTEXT.config.jira.testPlanIssueKey =
            env[ENV_JIRA_TEST_PLAN_ISSUE_KEY];
    }
    if (ENV_JIRA_ATTACH_VIDEO in env) {
        CONTEXT.config.jira.attachVideo = parseBoolean(
            env[ENV_JIRA_ATTACH_VIDEO]
        );
    }
    // Xray.
    if (ENV_XRAY_UPLOAD_RESULTS in env) {
        CONTEXT.config.xray.uploadResults = parseBoolean(
            env[ENV_XRAY_UPLOAD_RESULTS]
        );
    }
    if (ENV_XRAY_UPLOAD_SCREENSHOTS in env) {
        CONTEXT.config.xray.uploadScreenshots = parseBoolean(
            env[ENV_XRAY_UPLOAD_SCREENSHOTS]
        );
    }
    if (ENV_XRAY_STATUS_PASSED in env) {
        CONTEXT.config.xray.statusPassed = env[ENV_XRAY_STATUS_PASSED];
    }
    if (ENV_XRAY_STATUS_FAILED in env) {
        CONTEXT.config.xray.statusFailed = env[ENV_XRAY_STATUS_FAILED];
    }
    // Cucumber.
    if (ENV_CUCUMBER_FEATURE_FILE_EXTENSION in env) {
        CONTEXT.config.cucumber.featureFileExtension =
            env[ENV_CUCUMBER_FEATURE_FILE_EXTENSION];
    }
    if (ENV_CUCUMBER_UPLOAD_FEATURES in env) {
        CONTEXT.config.cucumber.uploadFeatures = parseBoolean(
            env[ENV_CUCUMBER_UPLOAD_FEATURES]
        );
    }
    if (ENV_CUCUMBER_DOWNLOAD_FEATURES in env) {
        CONTEXT.config.cucumber.downloadFeatures = parseBoolean(
            env[ENV_CUCUMBER_DOWNLOAD_FEATURES]
        );
    }
    // Plugin.
    if (ENV_PLUGIN_OVERWRITE_ISSUE_SUMMARY in env) {
        CONTEXT.config.plugin.overwriteIssueSummary = parseBoolean(
            env[ENV_PLUGIN_OVERWRITE_ISSUE_SUMMARY]
        );
    }
    if (ENV_PLUGIN_NORMALIZE_SCREENSHOT_NAMES in env) {
        CONTEXT.config.plugin.normalizeScreenshotNames = parseBoolean(
            env[ENV_PLUGIN_NORMALIZE_SCREENSHOT_NAMES]
        );
    }
    // OpenSSL.
    if (ENV_OPENSSL_ROOT_CA_PATH in env) {
        CONTEXT.config.openSSL.rootCAPath = env[ENV_OPENSSL_ROOT_CA_PATH];
    }
    if (ENV_OPENSSL_SECURE_OPTIONS in env) {
        CONTEXT.config.openSSL.secureOptions = env[ENV_OPENSSL_SECURE_OPTIONS];
    }
    CONTEXT.client = chooseUploader(env);
}

function chooseUploader(env: Cypress.ObjectLike): Client<any> {
    if (ENV_XRAY_CLIENT_ID in env && ENV_XRAY_CLIENT_SECRET in env) {
        return new CloudClient(
            new JWTCredentials(
                env[ENV_XRAY_CLIENT_ID],
                env[ENV_XRAY_CLIENT_SECRET]
            )
        );
    } else if (ENV_XRAY_API_TOKEN in env && CONTEXT.config.jira.serverUrl) {
        return new ServerClient(
            CONTEXT.config.jira.serverUrl,
            new PATCredentials(env[ENV_XRAY_API_TOKEN])
        );
    } else if (
        ENV_XRAY_USERNAME in env &&
        ENV_XRAY_PASSWORD in env &&
        CONTEXT.config.jira.serverUrl
    ) {
        return new ServerClient(
            CONTEXT.config.jira.serverUrl,
            new BasicAuthCredentials(
                env[ENV_XRAY_USERNAME],
                env[ENV_XRAY_PASSWORD]
            )
        );
    } else {
        throw new Error(
            "Failed to configure Xray uploader: no viable Xray configuration was found or the configuration you provided is not supported.\n" +
                "You can find all configurations that are currently supported at https://github.com/Qytera-Gmbh/cypress-xray-plugin#authentication"
        );
    }
}
