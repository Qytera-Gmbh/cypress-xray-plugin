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
    ENV_JIRA_FIELDS_DESCRIPTION,
    ENV_JIRA_FIELDS_LABELS,
    ENV_JIRA_FIELDS_SUMMARY,
    ENV_JIRA_FIELDS_TEST_ENVIRONMENTS,
    ENV_JIRA_FIELDS_TEST_PLAN,
    ENV_JIRA_FIELDS_TEST_TYPE,
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
    ENV_XRAY_TEST_ENVIRONMENTS,
    ENV_XRAY_UPLOAD_RESULTS,
    ENV_XRAY_UPLOAD_SCREENSHOTS,
} from "./constants";
import {
    CucumberPreprocessorArgs,
    CucumberPreprocessorExports,
    importOptionalDependency,
} from "./dependencies";
import { logDebug, logInfo } from "./logging/logging";
import { JiraFieldRepository } from "./repository/jira/fields/jiraFieldRepository";
import { JiraIssueFetcher, JiraIssueFetcherCloud } from "./repository/jira/fields/jiraIssueFetcher";
import { JiraRepository } from "./repository/jira/jiraRepository";
import {
    ClientCombination,
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalOpenSSLOptions,
    InternalPluginOptions,
    InternalXrayOptions,
    Options,
    PluginContext,
} from "./types/plugin";
import { dedent } from "./util/dedent";
import { HELP } from "./util/help";
import { asArrayOfStrings, asBoolean, asInt, asString, parse } from "./util/parsing";
import { pingJiraInstance, pingXrayCloud, pingXrayServer } from "./util/ping";

let context: PluginContext | undefined = undefined;

export function getPluginContext(): PluginContext | undefined {
    return context;
}

export function setPluginContext(newContext: PluginContext): void {
    context = newContext;
}

export function clearPluginContext(): void {
    context = undefined;
}

/**
 * Returns an {@link InternalJiraOptions | `InternalJiraOptions`} instance based on parsed environment
 * variables and a provided options object. Environment variables will take precedence over the
 * options set in the object.
 *
 * @param env - an object containing environment variables as properties
 * @param options - an options object containing Jira options
 * @returns the constructed internal Jira options
 */
export function initJiraOptions(
    env: Cypress.ObjectLike,
    options: Options["jira"]
): InternalJiraOptions {
    const projectKey = parse(env, ENV_JIRA_PROJECT_KEY, asString) ?? options.projectKey;
    if (!projectKey) {
        throw new Error("Plugin misconfiguration: Jira project key was not set");
    }
    const testExecutionIssueKey =
        parse(env, ENV_JIRA_TEST_EXECUTION_ISSUE_KEY, asString) ?? options.testExecutionIssueKey;
    if (testExecutionIssueKey && !testExecutionIssueKey.startsWith(projectKey)) {
        throw new Error(
            `Plugin misconfiguration: test execution issue key ${testExecutionIssueKey} does not belong to project ${projectKey}`
        );
    }
    const testPlanIssueKey =
        parse(env, ENV_JIRA_TEST_PLAN_ISSUE_KEY, asString) ?? options.testPlanIssueKey;
    if (testPlanIssueKey && !testPlanIssueKey.startsWith(projectKey)) {
        throw new Error(
            `Plugin misconfiguration: test plan issue key ${testPlanIssueKey} does not belong to project ${projectKey}`
        );
    }
    return {
        attachVideos:
            parse(env, ENV_JIRA_ATTACH_VIDEOS, asBoolean) ?? options.attachVideos ?? false,
        fields: {
            description:
                parse(env, ENV_JIRA_FIELDS_DESCRIPTION, asString) ?? options.fields?.description,
            labels: parse(env, ENV_JIRA_FIELDS_LABELS, asString) ?? options.fields?.labels,
            summary: parse(env, ENV_JIRA_FIELDS_SUMMARY, asString) ?? options.fields?.summary,
            testEnvironments:
                parse(env, ENV_JIRA_FIELDS_TEST_ENVIRONMENTS, asString) ??
                options.fields?.testEnvironments,
            testPlan: parse(env, ENV_JIRA_FIELDS_TEST_PLAN, asString) ?? options.fields?.testPlan,
            testType: parse(env, ENV_JIRA_FIELDS_TEST_TYPE, asString) ?? options.fields?.testType,
        },
        projectKey: projectKey,
        testExecutionIssueDescription:
            parse(env, ENV_JIRA_TEST_EXECUTION_ISSUE_DESCRIPTION, asString) ??
            options.testExecutionIssueDescription,
        testExecutionIssueDetails: { subtask: false },
        testExecutionIssueKey: testExecutionIssueKey,
        testExecutionIssueSummary:
            parse(env, ENV_JIRA_TEST_EXECUTION_ISSUE_SUMMARY, asString) ??
            options.testExecutionIssueSummary,
        testExecutionIssueType:
            parse(env, ENV_JIRA_TEST_EXECUTION_ISSUE_TYPE, asString) ??
            options.testExecutionIssueType ??
            "Test Execution",
        testPlanIssueKey: testPlanIssueKey,
        testPlanIssueType:
            parse(env, ENV_JIRA_TEST_PLAN_ISSUE_TYPE, asString) ??
            options.testPlanIssueType ??
            "Test Plan",
        url: parse(env, ENV_JIRA_URL, asString) ?? options.url,
    };
}

/**
 * Returns an {@link InternalPluginOptions | `InternalPluginOptions`} instance based on parsed
 * environment variables and a provided options object. Environment variables will take precedence
 * over the options set in the object.
 *
 * @param env - an object containing environment variables as properties
 * @param options - an options object containing plugin options
 * @returns the constructed internal plugin options
 */
export function initPluginOptions(
    env: Cypress.ObjectLike,
    options: Options["plugin"]
): InternalPluginOptions {
    return {
        debug: parse(env, ENV_PLUGIN_DEBUG, asBoolean) ?? options?.debug ?? false,
        enabled: parse(env, ENV_PLUGIN_ENABLED, asBoolean) ?? options?.enabled ?? true,
        logDirectory:
            parse(env, ENV_PLUGIN_LOG_DIRECTORY, asString) ?? options?.logDirectory ?? "logs",
        normalizeScreenshotNames:
            parse(env, ENV_PLUGIN_NORMALIZE_SCREENSHOT_NAMES, asBoolean) ??
            options?.normalizeScreenshotNames ??
            false,
    };
}

/**
 * Returns an {@link InternalXrayOptions | `InternalXrayOptions`} instance based on parsed environment
 * variables and a provided options object. Environment variables will take precedence over the
 * options set in the object.
 *
 * @param env - an object containing environment variables as properties
 * @param options - an options object containing Xray options
 * @returns the constructed internal Xray options
 */
export function initXrayOptions(
    env: Cypress.ObjectLike,
    options: Options["xray"]
): InternalXrayOptions {
    return {
        status: {
            failed: parse(env, ENV_XRAY_STATUS_FAILED, asString) ?? options?.status?.failed,
            passed: parse(env, ENV_XRAY_STATUS_PASSED, asString) ?? options?.status?.passed,
            pending: parse(env, ENV_XRAY_STATUS_PENDING, asString) ?? options?.status?.pending,
            skipped: parse(env, ENV_XRAY_STATUS_SKIPPED, asString) ?? options?.status?.skipped,
        },
        testEnvironments:
            parse(env, ENV_XRAY_TEST_ENVIRONMENTS, asArrayOfStrings) ?? options?.testEnvironments,
        uploadResults:
            parse(env, ENV_XRAY_UPLOAD_RESULTS, asBoolean) ?? options?.uploadResults ?? true,
        uploadScreenshots:
            parse(env, ENV_XRAY_UPLOAD_SCREENSHOTS, asBoolean) ??
            options?.uploadScreenshots ??
            true,
    };
}

/**
 * Returns an {@link InternalCucumberOptions | `InternalCucumberOptions`} instance based on parsed
 * environment variables and a provided options object. Environment variables will take precedence
 * over the options set in the object.
 *
 * @param env - an object containing environment variables as properties
 * @param options - an options object containing Cucumber options
 * @returns the constructed internal Cucumber options
 */
export async function initCucumberOptions(
    config: CucumberPreprocessorArgs[0],
    options: Options["cucumber"]
): Promise<InternalCucumberOptions | undefined> {
    // Check if the user has chosen to upload Cucumber results, too.
    const featureFileExtension =
        parse(config.env, ENV_CUCUMBER_FEATURE_FILE_EXTENSION, asString) ??
        options?.featureFileExtension;
    // If the user has chosen to do so, we need to make sure they configured the Cucumber
    // preprocessor JSON report as well. Otherwise, results upload will not work.
    if (featureFileExtension) {
        let preprocessor: CucumberPreprocessorExports;
        try {
            preprocessor = await importOptionalDependency<CucumberPreprocessorExports>(
                "@badeball/cypress-cucumber-preprocessor"
            );
        } catch (error: unknown) {
            throw new Error(
                dedent(`
                    Plugin dependency misconfigured: @badeball/cypress-cucumber-preprocessor

                    ${error}

                    The plugin depends on the package and should automatically download it during installation, but might have failed to do so because of conflicting Node versions

                    Make sure to install the package manually using: npm install @badeball/cypress-cucumber-preprocessor --save-dev
                `)
            );
        }
        logDebug(
            `Successfully resolved configuration of @badeball/cypress-cucumber-preprocessor package`
        );
        const preprocessorConfiguration = await preprocessor.resolvePreprocessorConfiguration(
            config,
            config.env,
            "/"
        );
        if (!preprocessorConfiguration.json.enabled) {
            throw new Error(
                dedent(`
                        Plugin misconfiguration: Cucumber preprocessor JSON report disabled

                        Make sure to enable the JSON report as described in https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md
                    `)
            );
        }
        if (!preprocessorConfiguration.json.output) {
            throw new Error(
                dedent(`
                        Plugin misconfiguration: Cucumber preprocessor JSON report path was not set

                        Make sure to configure the JSON report path as described in https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md
                    `)
            );
        }
        return {
            downloadFeatures:
                parse(config.env, ENV_CUCUMBER_DOWNLOAD_FEATURES, asBoolean) ??
                options?.downloadFeatures ??
                false,
            featureFileExtension: featureFileExtension,
            preprocessor: preprocessorConfiguration,
            uploadFeatures:
                parse(config.env, ENV_CUCUMBER_UPLOAD_FEATURES, asBoolean) ??
                options?.uploadFeatures ??
                false,
        };
    }
    return undefined;
}

/**
 * Returns an {@link InternalOpenSSLOptions | `InternalOpenSSLOptions`} instance based on parsed
 * environment variables and a provided options object. Environment variables will take precedence
 * over the options set in the object.
 *
 * @param env - an object containing environment variables as properties
 * @param options - an options object containing OpenSSL options
 * @returns the constructed internal OpenSSL options
 */
export function initOpenSSLOptions(
    env: Cypress.ObjectLike,
    options: Options["openSSL"]
): InternalOpenSSLOptions {
    return {
        rootCAPath: parse(env, ENV_OPENSSL_ROOT_CA_PATH, asString) ?? options?.rootCAPath,
        secureOptions: parse(env, ENV_OPENSSL_SECURE_OPTIONS, asInt) ?? options?.secureOptions,
    };
}

export async function initClients(
    jiraOptions: InternalJiraOptions,
    env: Cypress.ObjectLike
): Promise<ClientCombination> {
    if (!jiraOptions.url) {
        throw new Error(
            dedent(`
                Failed to configure Jira client: no Jira URL was provided
                Make sure Jira was configured correctly: ${HELP.plugin.configuration.authentication.jira.root}
            `)
        );
    }
    if (ENV_JIRA_USERNAME in env && ENV_JIRA_API_TOKEN in env) {
        // Jira cloud authentication: username (Email) and token.
        logInfo("Jira username and API token found. Setting up Jira cloud basic auth credentials");
        const credentials = new BasicAuthCredentials(
            env[ENV_JIRA_USERNAME],
            env[ENV_JIRA_API_TOKEN]
        );
        await pingJiraInstance(jiraOptions.url, credentials);
        const jiraClient = new JiraClientCloud(jiraOptions.url, credentials);
        if (ENV_XRAY_CLIENT_ID in env && ENV_XRAY_CLIENT_SECRET in env) {
            // Xray cloud authentication: client ID and client secret.
            logInfo(
                "Xray client ID and client secret found. Setting up Xray cloud JWT credentials"
            );
            const xrayCredentials = new JWTCredentials(
                env[ENV_XRAY_CLIENT_ID],
                env[ENV_XRAY_CLIENT_SECRET],
                `${XrayClientCloud.URL}/authenticate`
            );
            await pingXrayCloud(xrayCredentials);
            const xrayClient = new XrayClientCloud(xrayCredentials);
            const jiraFieldRepository = new JiraFieldRepository(jiraClient, jiraOptions);
            const jiraFieldFetcher = new JiraIssueFetcherCloud(
                jiraClient,
                jiraFieldRepository,
                xrayClient,
                jiraOptions
            );
            return {
                kind: "cloud",
                jiraClient: jiraClient,
                xrayClient: xrayClient,
                jiraRepository: new JiraRepository(
                    jiraFieldRepository,
                    jiraFieldFetcher,
                    jiraOptions
                ),
            };
        } else {
            throw new Error(
                dedent(`
                    Failed to configure Xray client: Jira cloud credentials detected, but the provided Xray credentials are not Xray cloud credentials
                    You can find all configurations currently supported at: ${HELP.plugin.configuration.authentication.root}
                `)
            );
        }
    } else if (ENV_JIRA_API_TOKEN in env && jiraOptions.url) {
        // Jira server authentication: no username, only token.
        logInfo("Jira PAT found. Setting up Jira server PAT credentials");
        const credentials = new PATCredentials(env[ENV_JIRA_API_TOKEN]);
        await pingJiraInstance(jiraOptions.url, credentials);
        const jiraClient = new JiraClientServer(jiraOptions.url, credentials);
        // Xray server authentication: no username, only token.
        logInfo("Jira PAT found. Setting up Xray server PAT credentials");
        await pingXrayServer(jiraOptions.url, credentials);
        const xrayClient = new XrayClientServer(jiraOptions.url, credentials);
        const jiraFieldRepository = new JiraFieldRepository(jiraClient, jiraOptions);
        const jiraFieldFetcher = new JiraIssueFetcher(
            jiraClient,
            jiraFieldRepository,
            jiraOptions.fields
        );
        return {
            kind: "server",
            jiraClient: jiraClient,
            xrayClient: xrayClient,
            jiraRepository: new JiraRepository(jiraFieldRepository, jiraFieldFetcher, jiraOptions),
        };
    } else if (ENV_JIRA_USERNAME in env && ENV_JIRA_PASSWORD in env && jiraOptions.url) {
        logInfo("Jira username and password found. Setting up Jira server basic auth credentials");
        const credentials = new BasicAuthCredentials(
            env[ENV_JIRA_USERNAME],
            env[ENV_JIRA_PASSWORD]
        );
        await pingJiraInstance(jiraOptions.url, credentials);
        const jiraClient = new JiraClientServer(jiraOptions.url, credentials);
        logInfo("Jira username and password found. Setting up Xray server basic auth credentials");
        await pingXrayServer(jiraOptions.url, credentials);
        const xrayClient = new XrayClientServer(jiraOptions.url, credentials);
        const jiraFieldRepository = new JiraFieldRepository(jiraClient, jiraOptions);
        const jiraFieldFetcher = new JiraIssueFetcher(
            jiraClient,
            jiraFieldRepository,
            jiraOptions.fields
        );
        return {
            kind: "server",
            jiraClient: jiraClient,
            xrayClient: xrayClient,
            jiraRepository: new JiraRepository(jiraFieldRepository, jiraFieldFetcher, jiraOptions),
        };
    } else {
        throw new Error(
            dedent(`
                Failed to configure Jira client: no viable authentication method was configured
                You can find all configurations currently supported at: ${HELP.plugin.configuration.authentication.root}
            `)
        );
    }
}
