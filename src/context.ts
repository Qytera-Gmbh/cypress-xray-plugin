import { BasicAuthCredentials, JWTCredentials, PATCredentials } from "./authentication/credentials";
import { JiraClientCloud } from "./client/jira/jiraClientCloud";
import { JiraClientServer } from "./client/jira/jiraClientServer";
import { XrayClientCloud } from "./client/xray/xrayClientCloud";
import { XrayClientServer } from "./client/xray/xrayClientServer";
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
} from "./constants";
import { logInfo } from "./logging/logging";
import { InternalOptions, Options, XrayStepOptions } from "./types/plugin";
import { OneOf } from "./types/util";
import { asBoolean, asInt, asString, parse } from "./util/parsing";

export function initOptions(options: Options): InternalOptions {
    // Set some default values for constant options.
    return {
        jira: {
            attachVideos: options.jira?.attachVideos ?? false,
            createTestIssues: options.jira?.createTestIssues ?? true,
            projectKey: options.jira?.projectKey,
            testExecutionIssueDescription: options.jira?.testExecutionIssueDescription,
            testExecutionIssueKey: options.jira?.testExecutionIssueKey,
            testExecutionIssueSummary: options.jira?.testExecutionIssueSummary,
            testPlanIssueKey: options.jira?.testPlanIssueKey,
            url: options.jira?.url,
        },
        plugin: {
            debug: options.plugin?.debug ?? false,
            enabled: options.plugin?.enabled ?? true,
            normalizeScreenshotNames: options.plugin?.normalizeScreenshotNames ?? false,
            overwriteIssueSummary: options.plugin?.overwriteIssueSummary ?? false,
        },
        xray: {
            statusFailed: options.xray?.statusFailed,
            statusPassed: options.xray?.statusPassed,
            statusPending: options.xray?.statusPending,
            statusSkipped: options.xray?.statusSkipped,
            steps: {
                maxLengthAction: options.xray?.steps?.maxLengthAction ?? 8000,
                update: options.xray?.steps?.update ?? true,
            },
            testType: options.xray?.testType ?? "Manual",
            uploadResults: options.xray?.uploadResults ?? true,
            uploadScreenshots: options.xray?.uploadScreenshots ?? true,
        },
        cucumber: {
            featureFileExtension: options.cucumber?.featureFileExtension,
            downloadFeatures: options.cucumber?.downloadFeatures ?? false,
            issues: {},
            uploadFeatures: options.cucumber?.uploadFeatures ?? false,
        },
        openSSL: {
            rootCAPath: options.openSSL?.rootCAPath,
            secureOptions: options.openSSL?.secureOptions,
        },
    };
}

export function parseEnvironmentVariables(env: Cypress.ObjectLike): InternalOptions {
    return {
        jira: {
            projectKey: parse(env, ENV_JIRA_PROJECT_KEY, asString),
            attachVideos: parse(env, ENV_JIRA_ATTACH_VIDEOS, asBoolean),
            createTestIssues: parse(env, ENV_JIRA_CREATE_TEST_ISSUES, asBoolean),
            testExecutionIssueDescription: parse(
                env,
                ENV_JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION,
                asString
            ),
            testExecutionIssueKey: parse(env, ENV_JIRA_TEST_EXECUTION_ISSUE_KEY, asString),
            testExecutionIssueSummary: parse(env, ENV_JIRA_TEST_EXECUTION_ISSUE_SUMMARY, asString),
            testPlanIssueKey: parse(env, ENV_JIRA_TEST_PLAN_ISSUE_KEY, asString),
            url: parse(env, ENV_JIRA_URL, asString),
        },
        xray: {
            statusFailed: parse(env, ENV_XRAY_STATUS_FAILED, asString),
            statusPassed: parse(env, ENV_XRAY_STATUS_PASSED, asString),
            statusPending: parse(env, ENV_XRAY_STATUS_PENDING, asString),
            statusSkipped: parse(env, ENV_XRAY_STATUS_SKIPPED, asString),
            steps: {
                maxLengthAction: parse(env, ENV_XRAY_STEPS_MAX_LENGTH_ACTION, asInt),
                update: parse(env, ENV_XRAY_STEPS_UPDATE, asBoolean),
            },
            testType: parse(env, ENV_XRAY_TEST_TYPE, asString),
            uploadResults: parse(env, ENV_XRAY_UPLOAD_RESULTS, asBoolean),
            uploadScreenshots: parse(env, ENV_XRAY_UPLOAD_SCREENSHOTS, asBoolean),
        },
        cucumber: {
            featureFileExtension: parse(env, ENV_CUCUMBER_FEATURE_FILE_EXTENSION, asString),
            downloadFeatures: parse(env, ENV_CUCUMBER_DOWNLOAD_FEATURES, asBoolean),
            issues: {},
            uploadFeatures: parse(env, ENV_CUCUMBER_UPLOAD_FEATURES, asBoolean),
        },
        plugin: {
            enabled: parse(env, ENV_PLUGIN_ENABLED, asBoolean),
            debug: parse(env, ENV_PLUGIN_DEBUG, asBoolean),
            normalizeScreenshotNames: parse(env, ENV_PLUGIN_NORMALIZE_SCREENSHOT_NAMES, asBoolean),
            overwriteIssueSummary: parse(env, ENV_PLUGIN_OVERWRITE_ISSUE_SUMMARY, asBoolean),
        },
        openSSL: {
            rootCAPath: parse(env, ENV_OPENSSL_ROOT_CA_PATH, asString),
            secureOptions: parse(env, ENV_OPENSSL_SECURE_OPTIONS, asInt),
        },
    };
}

export function mergeOptions(
    configOptions: InternalOptions,
    envOptions: InternalOptions
): InternalOptions {
    return {
        jira: {
            projectKey: envOptions.jira.projectKey ?? configOptions.jira.projectKey,
            attachVideos: envOptions.jira.attachVideos ?? configOptions.jira.attachVideos,
            createTestIssues:
                envOptions.jira.createTestIssues ?? configOptions.jira.createTestIssues,
            testExecutionIssueDescription:
                envOptions.jira.testExecutionIssueDescription ??
                configOptions.jira.testExecutionIssueDescription,
            testExecutionIssueKey:
                envOptions.jira.testExecutionIssueKey ?? configOptions.jira.testExecutionIssueKey,
            testExecutionIssueSummary:
                envOptions.jira.testExecutionIssueSummary ??
                configOptions.jira.testExecutionIssueSummary,
            testPlanIssueKey:
                envOptions.jira.testPlanIssueKey ?? configOptions.jira.testPlanIssueKey,
            url: envOptions.jira.url ?? configOptions.jira.url,
        },
        xray: {
            statusFailed: envOptions.xray.statusFailed ?? configOptions.xray.statusFailed,
            statusPassed: envOptions.xray.statusPassed ?? configOptions.xray.statusPassed,
            statusPending: envOptions.xray.statusPending ?? configOptions.xray.statusPending,
            statusSkipped: envOptions.xray.statusSkipped ?? configOptions.xray.statusSkipped,
            steps: {
                maxLengthAction:
                    envOptions.xray.steps.maxLengthAction ??
                    configOptions.xray.steps.maxLengthAction,
                update: envOptions.xray.steps.update ?? configOptions.xray.steps.update,
            },
            testType: envOptions.xray.testType ?? configOptions.xray.testType,
            uploadResults: envOptions.xray.uploadResults ?? configOptions.xray.uploadResults,
            uploadScreenshots:
                envOptions.xray.uploadScreenshots ?? configOptions.xray.uploadScreenshots,
        },
        cucumber: {
            featureFileExtension:
                envOptions.cucumber.featureFileExtension ??
                configOptions.cucumber.featureFileExtension,
            downloadFeatures:
                envOptions.cucumber.downloadFeatures ?? configOptions.cucumber.downloadFeatures,
            issues: envOptions.cucumber.issues ?? configOptions.cucumber.issues,
            uploadFeatures:
                envOptions.cucumber.uploadFeatures ?? configOptions.cucumber.uploadFeatures,
        },
        plugin: {
            enabled: envOptions.plugin.enabled ?? configOptions.plugin.enabled,
            debug: envOptions.plugin.debug ?? configOptions.plugin.debug,
            normalizeScreenshotNames:
                envOptions.plugin.normalizeScreenshotNames ??
                configOptions.plugin.normalizeScreenshotNames,
            overwriteIssueSummary:
                envOptions.plugin.overwriteIssueSummary ??
                configOptions.plugin.overwriteIssueSummary,
        },
        openSSL: {
            rootCAPath: envOptions.openSSL.rootCAPath ?? configOptions.openSSL.rootCAPath,
            secureOptions: envOptions.openSSL.secureOptions ?? configOptions.openSSL.secureOptions,
        },
    };
}

export function verifyContext(options: InternalOptions) {
    verifyJiraProjectKey(options.jira.projectKey);
    verifyJiraTestExecutionIssueKey(options.jira.projectKey, options.jira.testExecutionIssueKey);
    verifyJiraTestPlanIssueKey(options.jira.projectKey, options.jira.testPlanIssueKey);
    verifyXraySteps(options.xray.steps);
}

function verifyJiraProjectKey(projectKey?: string) {
    if (!projectKey) {
        throw new Error("Plugin misconfiguration: Jira project key was not set");
    }
}

function verifyJiraTestExecutionIssueKey(projectKey: string, testExecutionIssueKey?: string) {
    if (testExecutionIssueKey && !testExecutionIssueKey.startsWith(projectKey)) {
        throw new Error(
            `Plugin misconfiguration: test execution issue key ${testExecutionIssueKey} does not belong to project ${projectKey}`
        );
    }
}

function verifyJiraTestPlanIssueKey(projectKey: string, testPlanIssueKey?: string) {
    if (testPlanIssueKey && !testPlanIssueKey.startsWith(projectKey)) {
        throw new Error(
            `Plugin misconfiguration: test plan issue key ${testPlanIssueKey} does not belong to project ${projectKey}`
        );
    }
}

function verifyXraySteps(steps: XrayStepOptions) {
    if (steps.maxLengthAction <= 0) {
        throw new Error(
            `Plugin misconfiguration: max length of step actions must be a positive number: ${steps.maxLengthAction}`
        );
    }
}

export function initXrayClient(
    options: InternalOptions,
    env: Cypress.ObjectLike
): OneOf<[XrayClientServer, XrayClientCloud]> {
    if (ENV_XRAY_CLIENT_ID in env && ENV_XRAY_CLIENT_SECRET in env) {
        logInfo("Xray client ID and client secret found. Setting up Xray cloud credentials.");
        return new XrayClientCloud(
            new JWTCredentials(env[ENV_XRAY_CLIENT_ID], env[ENV_XRAY_CLIENT_SECRET])
        );
    } else if (ENV_JIRA_API_TOKEN in env && options.jira.url) {
        logInfo("Jira PAT found. Setting up Xray PAT credentials.");
        return new XrayClientServer(options.jira.url, new PATCredentials(env[ENV_JIRA_API_TOKEN]));
    } else if (ENV_JIRA_USERNAME in env && ENV_JIRA_PASSWORD in env && options.jira.url) {
        logInfo("Jira username and password found. Setting up Xray basic auth credentials.");
        return new XrayClientServer(
            options.jira.url,
            new BasicAuthCredentials(env[ENV_JIRA_USERNAME], env[ENV_JIRA_PASSWORD])
        );
    } else {
        throw new Error(
            "Failed to configure Xray uploader: no viable Xray configuration was found or the configuration you provided is not supported.\n" +
                "You can find all configurations currently supported at https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/"
        );
    }
}
export function initJiraClient(
    options: InternalOptions,
    env: Cypress.ObjectLike
): OneOf<[JiraClientServer, JiraClientCloud]> {
    if (!options.jira.url) {
        throw new Error(
            "Failed to configure Jira client: no Jira URL was provided.\n" +
                "Make sure Jira was configured correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#jira"
        );
    }
    if (ENV_JIRA_API_TOKEN in env && ENV_JIRA_USERNAME in env) {
        // Jira Cloud authentication: username (Email) and token.
        logInfo(
            "Jira username and API token found. Setting up basic auth credentials for Jira cloud."
        );
        return new JiraClientCloud(
            options.jira.url,
            new BasicAuthCredentials(env[ENV_JIRA_USERNAME], env[ENV_JIRA_API_TOKEN])
        );
    } else if (ENV_JIRA_API_TOKEN in env) {
        // Jira Server authentication: no username, only token.
        logInfo("Jira PAT found. Setting up PAT credentials for Jira server.");
        return new JiraClientServer(options.jira.url, new PATCredentials(env[ENV_JIRA_API_TOKEN]));
    } else if (ENV_JIRA_USERNAME in env && ENV_JIRA_PASSWORD in env) {
        // Jira Server authentication: username and password.
        logInfo(
            "Jira username and password found. Setting up basic auth credentials for Jira server."
        );
        return new JiraClientServer(
            options.jira.url,
            new BasicAuthCredentials(env[ENV_JIRA_USERNAME], env[ENV_JIRA_PASSWORD])
        );
    } else {
        throw new Error(
            "Failed to configure Jira client: no viable authentication method was configured.\n" +
                "You can find all configurations currently supported at https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/"
        );
    }
}
