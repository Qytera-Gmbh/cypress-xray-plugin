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
    ENV_JIRA_PASSWORD,
    ENV_JIRA_PROJECT_KEY,
    ENV_JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION,
    ENV_JIRA_TEST_EXECUTION_ISSUE_KEY,
    ENV_JIRA_TEST_EXECUTION_ISSUE_SUMMARY,
    ENV_JIRA_TEST_EXECUTION_ISSUE_TYPE,
    ENV_JIRA_TEST_PLAN_ISSUE_KEY,
    ENV_JIRA_TEST_PLAN_ISSUE_TYPE,
    ENV_JIRA_URL,
    ENV_JIRA_USERNAME,
    ENV_OPENSSL_ROOT_CA_PATH,
    ENV_OPENSSL_SECURE_OPTIONS,
    ENV_PLUGIN_DEBUG,
    ENV_PLUGIN_ENABLED,
    ENV_PLUGIN_LOG_DIRECTORY,
    ENV_PLUGIN_NORMALIZE_SCREENSHOT_NAMES,
    ENV_XRAY_CLIENT_ID,
    ENV_XRAY_CLIENT_SECRET,
    ENV_XRAY_STATUS_FAILED,
    ENV_XRAY_STATUS_PASSED,
    ENV_XRAY_STATUS_PENDING,
    ENV_XRAY_STATUS_SKIPPED,
    ENV_XRAY_STEPS_MAX_LENGTH_ACTION,
    ENV_XRAY_STEPS_UPDATE,
    ENV_XRAY_UPLOAD_RESULTS,
    ENV_XRAY_UPLOAD_SCREENSHOTS,
} from "./constants";
import { logInfo } from "./logging/logging";
import { JiraRepositoryCloud } from "./repository/jira/jiraRepositoryCloud";
import { JiraRepositoryServer } from "./repository/jira/jiraRepositoryServer";
import { ClientCombination, InternalOptions, Options, XrayStepOptions } from "./types/plugin";
import { dedent } from "./types/util";
import { asBoolean, asInt, asString, parse } from "./util/parsing";

export function initOptions(env: Cypress.ObjectLike, options: Options): InternalOptions {
    return {
        jira: {
            attachVideos:
                parse(env, ENV_JIRA_ATTACH_VIDEOS, asBoolean) ?? options.jira.attachVideos ?? false,
            projectKey: parse(env, ENV_JIRA_PROJECT_KEY, asString) ?? options.jira.projectKey,
            testExecutionIssueDescription:
                parse(env, ENV_JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION, asString) ??
                options.jira.testExecutionIssueDescription,
            testExecutionIssueKey:
                parse(env, ENV_JIRA_TEST_EXECUTION_ISSUE_KEY, asString) ??
                options.jira.testExecutionIssueKey,
            testExecutionIssueSummary:
                parse(env, ENV_JIRA_TEST_EXECUTION_ISSUE_SUMMARY, asString) ??
                options.jira.testExecutionIssueSummary,
            testExecutionIssueType:
                parse(env, ENV_JIRA_TEST_EXECUTION_ISSUE_TYPE, asString) ??
                options.jira.testExecutionIssueType ??
                "Test Execution",
            testPlanIssueKey:
                parse(env, ENV_JIRA_TEST_PLAN_ISSUE_KEY, asString) ?? options.jira.testPlanIssueKey,
            testPlanIssueType:
                parse(env, ENV_JIRA_TEST_PLAN_ISSUE_TYPE, asString) ??
                options.jira.testPlanIssueType ??
                "Test Plan",
            url: parse(env, ENV_JIRA_URL, asString) ?? options.jira.url,
        },
        plugin: {
            debug: parse(env, ENV_PLUGIN_DEBUG, asBoolean) ?? options.plugin?.debug ?? false,
            enabled: parse(env, ENV_PLUGIN_ENABLED, asBoolean) ?? options.plugin?.enabled ?? true,
            logDirectory:
                parse(env, ENV_PLUGIN_LOG_DIRECTORY, asString) ??
                options.plugin?.logDirectory ??
                "logs",
            normalizeScreenshotNames:
                parse(env, ENV_PLUGIN_NORMALIZE_SCREENSHOT_NAMES, asBoolean) ??
                options.plugin?.normalizeScreenshotNames ??
                false,
        },
        xray: {
            statusFailed:
                parse(env, ENV_XRAY_STATUS_FAILED, asString) ?? options.xray?.statusFailed,
            statusPassed:
                parse(env, ENV_XRAY_STATUS_PASSED, asString) ?? options.xray?.statusPassed,
            statusPending:
                parse(env, ENV_XRAY_STATUS_PENDING, asString) ?? options.xray?.statusPending,
            statusSkipped:
                parse(env, ENV_XRAY_STATUS_SKIPPED, asString) ?? options.xray?.statusSkipped,
            steps: {
                maxLengthAction:
                    parse(env, ENV_XRAY_STEPS_MAX_LENGTH_ACTION, asInt) ??
                    options.xray?.steps?.maxLengthAction ??
                    8000,
                update:
                    parse(env, ENV_XRAY_STEPS_UPDATE, asBoolean) ??
                    options.xray?.steps?.update ??
                    false,
            },
            uploadResults:
                parse(env, ENV_XRAY_UPLOAD_RESULTS, asBoolean) ??
                options.xray?.uploadResults ??
                true,
            uploadScreenshots:
                parse(env, ENV_XRAY_UPLOAD_SCREENSHOTS, asBoolean) ??
                options.xray?.uploadScreenshots ??
                true,
        },
        cucumber: {
            featureFileExtension:
                parse(env, ENV_CUCUMBER_FEATURE_FILE_EXTENSION, asString) ??
                options.cucumber?.featureFileExtension,
            downloadFeatures:
                parse(env, ENV_CUCUMBER_DOWNLOAD_FEATURES, asBoolean) ??
                options.cucumber?.downloadFeatures ??
                false,
            uploadFeatures:
                parse(env, ENV_CUCUMBER_UPLOAD_FEATURES, asBoolean) ??
                options.cucumber?.uploadFeatures ??
                false,
        },
        openSSL: {
            rootCAPath:
                parse(env, ENV_OPENSSL_ROOT_CA_PATH, asString) ?? options.openSSL?.rootCAPath,
            secureOptions:
                parse(env, ENV_OPENSSL_SECURE_OPTIONS, asInt) ?? options.openSSL?.secureOptions,
        },
    };
}

export function verifyOptions(options: InternalOptions) {
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

export function initClients(options: InternalOptions, env: Cypress.ObjectLike): ClientCombination {
    if (!options.jira.url) {
        throw new Error(
            dedent(`
                Failed to configure Jira client: no Jira URL was provided
                Make sure Jira was configured correctly: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#jira
            `)
        );
    }
    if (ENV_JIRA_USERNAME in env && ENV_JIRA_API_TOKEN in env) {
        // Jira cloud authentication: username (Email) and token.
        logInfo("Jira username and API token found. Setting up Jira cloud basic auth credentials");
        const jiraClient = new JiraClientCloud(
            options.jira.url,
            new BasicAuthCredentials(env[ENV_JIRA_USERNAME], env[ENV_JIRA_API_TOKEN])
        );
        if (ENV_XRAY_CLIENT_ID in env && ENV_XRAY_CLIENT_SECRET in env) {
            // Xray cloud authentication: client ID and client secret.
            logInfo(
                "Xray client ID and client secret found. Setting up Xray cloud JWT credentials"
            );
            const xrayClient = new XrayClientCloud(
                new JWTCredentials(env[ENV_XRAY_CLIENT_ID], env[ENV_XRAY_CLIENT_SECRET])
            );
            return {
                kind: "cloud",
                jiraClient: jiraClient,
                xrayClient: xrayClient,
                jiraRepository: new JiraRepositoryCloud(jiraClient, xrayClient, options),
            };
        } else {
            throw new Error(
                dedent(`
                    Failed to configure Xray client: Jira cloud credentials detected, but the provided Xray credentials are not Xray cloud credentials
                    You can find all configurations currently supported at: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/
                `)
            );
        }
    } else if (ENV_JIRA_API_TOKEN in env && options.jira.url) {
        // Jira server authentication: no username, only token.
        logInfo("Jira PAT found. Setting up Jira server PAT credentials");
        const jiraClient = new JiraClientServer(
            options.jira.url,
            new PATCredentials(env[ENV_JIRA_API_TOKEN])
        );
        // Xray server authentication: no username, only token.
        logInfo("Jira PAT found. Setting up Xray server PAT credentials");
        const xrayClient = new XrayClientServer(
            options.jira.url,
            new PATCredentials(env[ENV_JIRA_API_TOKEN]),
            jiraClient
        );
        return {
            kind: "server",
            jiraClient: jiraClient,
            xrayClient: xrayClient,
            jiraRepository: new JiraRepositoryServer(jiraClient, xrayClient, options),
        };
    } else if (ENV_JIRA_USERNAME in env && ENV_JIRA_PASSWORD in env && options.jira.url) {
        logInfo("Jira username and password found. Setting up Jira server basic auth credentials");
        const jiraClient = new JiraClientServer(
            options.jira.url,
            new BasicAuthCredentials(env[ENV_JIRA_USERNAME], env[ENV_JIRA_PASSWORD])
        );
        logInfo("Jira username and password found. Setting up Xray server basic auth credentials");
        const xrayClient = new XrayClientServer(
            options.jira.url,
            new BasicAuthCredentials(env[ENV_JIRA_USERNAME], env[ENV_JIRA_PASSWORD]),
            jiraClient
        );
        return {
            kind: "server",
            jiraClient: jiraClient,
            xrayClient: xrayClient,
            jiraRepository: new JiraRepositoryServer(jiraClient, xrayClient, options),
        };
    } else {
        throw new Error(
            dedent(`
                Failed to configure Jira client: no viable authentication method was configured
                You can find all configurations currently supported at: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/
            `)
        );
    }
}
export function initJiraRepository(
    clients: ClientCombination,
    options: Options
): JiraRepositoryServer | JiraRepositoryCloud {
    if (clients.kind === "cloud") {
        return new JiraRepositoryCloud(clients.jiraClient, clients.xrayClient, options);
    } else {
        return new JiraRepositoryServer(clients.jiraClient, clients.xrayClient, options);
    }
}
