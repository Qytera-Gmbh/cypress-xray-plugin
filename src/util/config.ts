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
    ENV_JIRA_ATTACH_VIDEOS,
    ENV_JIRA_CREATE_TEST_ISSUES,
    ENV_JIRA_PASSWORD,
    ENV_JIRA_PROJECT_KEY,
    ENV_JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION,
    ENV_JIRA_TEST_EXECUTION_ISSUE_KEY,
    ENV_JIRA_TEST_EXECUTION_ISSUE_SUMMARY,
    ENV_JIRA_TEST_PLAN_ISSUE_KEY,
    ENV_JIRA_URL,
    ENV_JIRA_USERNAME,
    ENV_OPENSSL_ROOT_CA_PATH,
    ENV_OPENSSL_SECURE_OPTIONS,
    ENV_PLUGIN_DEBUG,
    ENV_PLUGIN_ENABLED,
    ENV_PLUGIN_NORMALIZE_SCREENSHOT_NAMES,
    ENV_PLUGIN_OVERWRITE_ISSUE_SUMMARY,
    ENV_XRAY_CLIENT_ID,
    ENV_XRAY_CLIENT_SECRET,
    ENV_XRAY_STATUS_FAILED,
    ENV_XRAY_STATUS_PASSED,
    ENV_XRAY_STATUS_PENDING,
    ENV_XRAY_STATUS_SKIPPED,
    ENV_XRAY_STEPS_MAX_LENGTH_ACTION,
    ENV_XRAY_STEPS_UPDATE,
    ENV_XRAY_TEST_TYPE,
    ENV_XRAY_UPLOAD_RESULTS,
    ENV_XRAY_UPLOAD_SCREENSHOTS,
} from "../constants";
import { CONTEXT } from "../context";
import { logInfo } from "../logging/logging";
import { asBoolean, asInt, asString } from "./parsing";

export function parseEnvironmentVariables(env: Cypress.ObjectLike): void {
    CONTEXT.config = {
        jira: {
            projectKey:
                parse(env, ENV_JIRA_PROJECT_KEY, asString) ?? CONTEXT.config.jira.projectKey,
            attachVideos:
                parse(env, ENV_JIRA_ATTACH_VIDEOS, asBoolean) ?? CONTEXT.config.jira.attachVideos,
            createTestIssues:
                parse(env, ENV_JIRA_CREATE_TEST_ISSUES, asBoolean) ??
                CONTEXT.config.jira.createTestIssues,
            testExecutionIssueDescription:
                parse(env, ENV_JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION, asString) ??
                CONTEXT.config.jira.testExecutionIssueDescription,
            testExecutionIssueKey:
                parse(env, ENV_JIRA_TEST_EXECUTION_ISSUE_KEY, asString) ??
                CONTEXT.config.jira.testExecutionIssueKey,
            testExecutionIssueSummary:
                parse(env, ENV_JIRA_TEST_EXECUTION_ISSUE_SUMMARY, asString) ??
                CONTEXT.config.jira.testExecutionIssueSummary,
            testPlanIssueKey:
                parse(env, ENV_JIRA_TEST_PLAN_ISSUE_KEY, asString) ??
                CONTEXT.config.jira.testPlanIssueKey,
            url: parse(env, ENV_JIRA_URL, asString) ?? CONTEXT.config.jira.url,
        },
        xray: {
            statusFailed:
                parse(env, ENV_XRAY_STATUS_FAILED, asString) ?? CONTEXT.config.xray.statusFailed,
            statusPassed:
                parse(env, ENV_XRAY_STATUS_PASSED, asString) ?? CONTEXT.config.xray.statusPassed,
            statusPending:
                parse(env, ENV_XRAY_STATUS_PENDING, asString) ?? CONTEXT.config.xray.statusPending,
            statusSkipped:
                parse(env, ENV_XRAY_STATUS_SKIPPED, asString) ?? CONTEXT.config.xray.statusSkipped,
            steps: {
                maxLengthAction:
                    parse(env, ENV_XRAY_STEPS_MAX_LENGTH_ACTION, asInt) ??
                    CONTEXT.config.xray.steps.maxLengthAction,
                update:
                    parse(env, ENV_XRAY_STEPS_UPDATE, asBoolean) ??
                    CONTEXT.config.xray.steps.update,
            },
            testType: parse(env, ENV_XRAY_TEST_TYPE, asString) ?? CONTEXT.config.xray.testType,
            uploadResults:
                parse(env, ENV_XRAY_UPLOAD_RESULTS, asBoolean) ?? CONTEXT.config.xray.uploadResults,
            uploadScreenshots:
                parse(env, ENV_XRAY_UPLOAD_SCREENSHOTS, asBoolean) ??
                CONTEXT.config.xray.uploadScreenshots,
        },
        cucumber: {
            featureFileExtension:
                parse(env, ENV_CUCUMBER_FEATURE_FILE_EXTENSION, asString) ??
                CONTEXT.config.cucumber.featureFileExtension,
            downloadFeatures:
                parse(env, ENV_CUCUMBER_DOWNLOAD_FEATURES, asBoolean) ??
                CONTEXT.config.cucumber.downloadFeatures,
            uploadFeatures:
                parse(env, ENV_CUCUMBER_UPLOAD_FEATURES, asBoolean) ??
                CONTEXT.config.cucumber.uploadFeatures,
        },
        plugin: {
            enabled: parse(env, ENV_PLUGIN_ENABLED, asBoolean) ?? CONTEXT.config.plugin.enabled,
            debug: parse(env, ENV_PLUGIN_DEBUG, asBoolean) ?? CONTEXT.config.plugin.debug,
            normalizeScreenshotNames:
                parse(env, ENV_PLUGIN_NORMALIZE_SCREENSHOT_NAMES, asBoolean) ??
                CONTEXT.config.plugin.normalizeScreenshotNames,
            overwriteIssueSummary:
                parse(env, ENV_PLUGIN_OVERWRITE_ISSUE_SUMMARY, asBoolean) ??
                CONTEXT.config.plugin.overwriteIssueSummary,
        },
        openSSL: {
            rootCAPath:
                parse(env, ENV_OPENSSL_ROOT_CA_PATH, asString) ?? CONTEXT.config.openSSL.rootCAPath,
            secureOptions:
                parse(env, ENV_OPENSSL_SECURE_OPTIONS, asInt) ??
                CONTEXT.config.openSSL.secureOptions,
        },
    };
}

function parse<T>(
    env: Cypress.ObjectLike,
    variable: string,
    parser: (parameter: string) => T
): T | undefined {
    return variable in env ? parser(env[variable]) : undefined;
}

export function initXrayClient(env: Cypress.ObjectLike): void {
    if (ENV_XRAY_CLIENT_ID in env && ENV_XRAY_CLIENT_SECRET in env) {
        logInfo("Xray client ID and client secret found. Setting up Xray cloud credentials.");
        CONTEXT.xrayClient = new XrayClientCloud(
            new JWTCredentials(env[ENV_XRAY_CLIENT_ID], env[ENV_XRAY_CLIENT_SECRET])
        );
    } else if (ENV_JIRA_API_TOKEN in env && CONTEXT.config.jira.url) {
        logInfo("Jira PAT found. Setting up Xray PAT credentials.");
        CONTEXT.xrayClient = new XrayClientServer(
            CONTEXT.config.jira.url,
            new PATCredentials(env[ENV_JIRA_API_TOKEN])
        );
    } else if (ENV_JIRA_USERNAME in env && ENV_JIRA_PASSWORD in env && CONTEXT.config.jira.url) {
        logInfo("Jira username and password found. Setting up Xray basic auth credentials.");
        CONTEXT.xrayClient = new XrayClientServer(
            CONTEXT.config.jira.url,
            new BasicAuthCredentials(env[ENV_JIRA_USERNAME], env[ENV_JIRA_PASSWORD])
        );
    } else {
        throw new Error(
            "Failed to configure Xray uploader: no viable Xray configuration was found or the configuration you provided is not supported.\n" +
                "You can find all configurations currently supported at https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/"
        );
    }
}
export function initJiraClient(env: Cypress.ObjectLike): void {
    const dependentOptions = getJiraClientDependentOptions();
    if (!dependentOptions) {
        return;
    }
    if (!CONTEXT.config.jira.url) {
        throw new Error(
            `Failed to configure Jira client: no Jira URL was provided. Configured options which necessarily require a configured Jira client:\n${dependentOptions}`
        );
    }
    if (ENV_JIRA_API_TOKEN in env && ENV_JIRA_USERNAME in env) {
        // Jira Cloud authentication: username (Email) and token.
        logInfo(
            "Jira username and API token found. Setting up basic auth credentials for Jira cloud."
        );
        CONTEXT.jiraClient = new JiraClient(
            CONTEXT.config.jira.url,
            new BasicAuthCredentials(env[ENV_JIRA_USERNAME], env[ENV_JIRA_API_TOKEN])
        );
    } else if (ENV_JIRA_API_TOKEN in env) {
        // Jira Server authentication: no username, only token.
        logInfo("Jira PAT found. Setting up PAT credentials for Jira server.");
        CONTEXT.jiraClient = new JiraClient(
            CONTEXT.config.jira.url,
            new PATCredentials(env[ENV_JIRA_API_TOKEN])
        );
    } else if (ENV_JIRA_USERNAME in env && ENV_JIRA_PASSWORD in env) {
        // Jira Server authentication: username and password.
        logInfo(
            "Jira username and password found. Setting up basic auth credentials for Jira server."
        );
        CONTEXT.jiraClient = new JiraClient(
            CONTEXT.config.jira.url,
            new BasicAuthCredentials(env[ENV_JIRA_USERNAME], env[ENV_JIRA_PASSWORD])
        );
    } else {
        throw new Error(
            "Failed to configure Jira client: no viable authentication method was configured.\n" +
                "You can find all configurations currently supported at https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/"
        );
    }
}

function getJiraClientDependentOptions(): string | undefined {
    const dependentOptions = [];
    if (CONTEXT.config.jira.attachVideos) {
        const optionName = `${getPropertyName(CONTEXT.config, (x) => x.jira)}.${getPropertyName(
            CONTEXT.config.jira,
            (x) => x.attachVideos
        )}`;
        dependentOptions.push(`${optionName} = ${CONTEXT.config.jira.attachVideos}`);
    }
    if (dependentOptions.length === 0) {
        return;
    }
    return `[\n\t${dependentOptions.join("\t\n")}\n]`;
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
