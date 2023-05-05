import {
    BasicAuthCredentials,
    JWTCredentials,
    PATCredentials,
} from "../authentication/credentials";
import { JiraClient } from "../client/jira/jiraClient";
import { XrayClientCloud } from "../client/xray/xrayClientCloud";
import { XrayClientServer } from "../client/xray/xrayClientServer";
import {
    ENV_CUCUMBER_DOWNLOAD_FEATURES,
    ENV_CUCUMBER_FEATURE_FILE_EXTENSION,
    ENV_CUCUMBER_UPLOAD_FEATURES,
    ENV_JIRA_API_TOKEN,
    ENV_JIRA_ATTACH_VIDEO,
    ENV_JIRA_PASSWORD,
    ENV_JIRA_PROJECT_KEY,
    ENV_JIRA_SERVER_URL,
    ENV_JIRA_TEST_EXECUTION_ISSUE_KEY,
    ENV_JIRA_TEST_PLAN_ISSUE_KEY,
    ENV_JIRA_USERNAME,
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
import { logInfo } from "../logging/logging";
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
    CONTEXT.xrayClient = chooseUploader(env);
    CONTEXT.jiraClient = initJiraClient(env);
}

function chooseUploader(
    env: Cypress.ObjectLike
): XrayClientServer | XrayClientCloud {
    if (ENV_XRAY_CLIENT_ID in env && ENV_XRAY_CLIENT_SECRET in env) {
        logInfo(
            "Xray client ID and client secret found. Setting up Xray cloud credentials."
        );
        return new XrayClientCloud(
            new JWTCredentials(
                env[ENV_XRAY_CLIENT_ID],
                env[ENV_XRAY_CLIENT_SECRET]
            )
        );
    } else if (ENV_XRAY_API_TOKEN in env && CONTEXT.config.jira.serverUrl) {
        logInfo("Xray PAT found. Setting up Xray PAT credentials.");
        return new XrayClientServer(
            CONTEXT.config.jira.serverUrl,
            new PATCredentials(env[ENV_XRAY_API_TOKEN])
        );
    } else if (
        ENV_XRAY_USERNAME in env &&
        ENV_XRAY_PASSWORD in env &&
        CONTEXT.config.jira.serverUrl
    ) {
        logInfo(
            "Xray username and password found. Setting up Xray basic auth credentials."
        );
        return new XrayClientServer(
            CONTEXT.config.jira.serverUrl,
            new BasicAuthCredentials(
                env[ENV_XRAY_USERNAME],
                env[ENV_XRAY_PASSWORD]
            )
        );
    } else {
        throw new Error(
            "Failed to configure Xray uploader: no viable Xray configuration was found or the configuration you provided is not supported.\n" +
                "You can find all configurations currently supported at https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/"
        );
    }
}
function initJiraClient(env: Cypress.ObjectLike): JiraClient | undefined {
    let dependentOptions = [];
    if (CONTEXT.config.jira.attachVideo) {
        const optionName = `${getPropertyName(
            CONTEXT.config,
            (x) => x.jira
        )}.${getPropertyName(CONTEXT.config.jira, (x) => x.attachVideo)}`;
        dependentOptions.push(
            `${optionName}=${CONTEXT.config.jira.attachVideo}`
        );
    }
    if (dependentOptions.length === 0) {
        return;
    }
    if (!CONTEXT.config.jira.serverUrl) {
        throw new Error(
            `Failed to configure Jira client: no Jira URL was provided.\n` +
                `Configured options which necessarily require a configured Jira client: ${dependentOptions.join(
                    ", "
                )}`
        );
    }
    if (ENV_JIRA_API_TOKEN in env) {
        if (ENV_JIRA_USERNAME in env) {
            // Jira Cloud authentication: username (Email) and token.
            logInfo(
                "Jira username and API token found. Setting up basic auth credentials for Jira cloud."
            );
            return new JiraClient(
                CONTEXT.config.jira.serverUrl,
                new BasicAuthCredentials(
                    env[ENV_JIRA_USERNAME],
                    env[ENV_JIRA_API_TOKEN]
                )
            );
        }
        // Jira Server authentication: no username, only token.
        logInfo("Jira PAT found. Setting up PAT credentials for Jira server.");
        return new JiraClient(
            CONTEXT.config.jira.serverUrl,
            new PATCredentials(env[ENV_JIRA_API_TOKEN])
        );
    } else if (ENV_JIRA_USERNAME in env && ENV_JIRA_PASSWORD in env) {
        // Jira Server authentication: username and password.
        logInfo(
            "Jira username and password found. Setting up basic auth credentials for Jira server."
        );
        return new JiraClient(
            CONTEXT.config.jira.serverUrl,
            new BasicAuthCredentials(
                env[ENV_JIRA_USERNAME],
                env[ENV_JIRA_PASSWORD]
            )
        );
    }
    throw new Error(
        "Failed to configure Jira client: no viable authentication method was configured.\n" +
            "You can find all configurations currently supported at https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/"
    );
}

/**
 * Returns a property's name from an object as a string.
 *
 * @param obj the object
 * @param selector the property whose name is required
 * @returns the property as a string
 * @see https://stackoverflow.com/a/59498264
 */
function getPropertyName<T extends object>(
    obj: T,
    selector: (x: Record<keyof T, keyof T>) => keyof T
): keyof T {
    const keyRecord = Object.keys(obj).reduce((res, key) => {
        const typedKey = key as keyof T;
        res[typedKey] = typedKey;
        return res;
    }, {} as Record<keyof T, keyof T>);
    return selector(keyRecord);
}
