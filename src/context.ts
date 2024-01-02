import {
    BasicAuthCredentials,
    JwtCredentials,
    PatCredentials,
} from "./client/authentication/credentials";
import { JiraClientCloud } from "./client/jira/jira-client-cloud";
import { JiraClientServer } from "./client/jira/jira-client-server";
import { XrayClientCloud } from "./client/xray/xray-client-cloud";
import { XrayClientServer } from "./client/xray/xray-client-server";
import { ENV_NAMES } from "./env";
import {
    ClientCombination,
    CypressXrayPluginOptions,
    InternalCucumberOptions,
    InternalJiraOptions,
    InternalPluginOptions,
    InternalSslOptions,
    InternalXrayOptions,
    PluginContext,
} from "./types/plugin";
import { dedent } from "./util/dedent";
import {
    CucumberPreprocessorArgs,
    CucumberPreprocessorExports,
    importOptionalDependency,
} from "./util/dependencies";
import { errorMessage } from "./util/errors";
import { HELP } from "./util/help";
import { LOG, Level } from "./util/logging";
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
 * Returns an {@link InternalJiraOptions | `InternalJiraOptions`} instance based on parsed
 * environment variables and a provided options object. Environment variables will take precedence
 * over the options set in the object.
 *
 * @param env - an object containing environment variables as properties
 * @param options - an options object containing Jira options
 * @returns the constructed internal Jira options
 */
export function initJiraOptions(
    env: Cypress.ObjectLike,
    options: CypressXrayPluginOptions["jira"]
): InternalJiraOptions {
    const projectKey = parse(env, ENV_NAMES.jira.projectKey, asString) ?? options.projectKey;
    if (!projectKey) {
        throw new Error("Plugin misconfiguration: Jira project key was not set");
    }
    const testExecutionIssueKey =
        parse(env, ENV_NAMES.jira.testExecutionIssueKey, asString) ?? options.testExecutionIssueKey;
    if (testExecutionIssueKey && !testExecutionIssueKey.startsWith(projectKey)) {
        throw new Error(
            `Plugin misconfiguration: test execution issue key ${testExecutionIssueKey} does not belong to project ${projectKey}`
        );
    }
    const testPlanIssueKey =
        parse(env, ENV_NAMES.jira.testPlanIssueKey, asString) ?? options.testPlanIssueKey;
    if (testPlanIssueKey && !testPlanIssueKey.startsWith(projectKey)) {
        throw new Error(
            `Plugin misconfiguration: test plan issue key ${testPlanIssueKey} does not belong to project ${projectKey}`
        );
    }
    return {
        attachVideos:
            parse(env, ENV_NAMES.jira.attachVideos, asBoolean) ?? options.attachVideos ?? false,
        fields: {
            description:
                parse(env, ENV_NAMES.jira.fields.description, asString) ??
                options.fields?.description,
            labels: parse(env, ENV_NAMES.jira.fields.labels, asString) ?? options.fields?.labels,
            summary: parse(env, ENV_NAMES.jira.fields.summary, asString) ?? options.fields?.summary,
            testEnvironments:
                parse(env, ENV_NAMES.jira.fields.testEnvironments, asString) ??
                options.fields?.testEnvironments,
            testPlan:
                parse(env, ENV_NAMES.jira.fields.testPlan, asString) ?? options.fields?.testPlan,
            testType:
                parse(env, ENV_NAMES.jira.fields.testType, asString) ?? options.fields?.testType,
        },
        projectKey: projectKey,
        testExecutionIssueDescription:
            parse(env, ENV_NAMES.jira.testExecutionIssueDescription, asString) ??
            options.testExecutionIssueDescription,
        testExecutionIssueKey: testExecutionIssueKey,
        testExecutionIssueSummary:
            parse(env, ENV_NAMES.jira.testExecutionIssueSummary, asString) ??
            options.testExecutionIssueSummary,
        testExecutionIssueType:
            parse(env, ENV_NAMES.jira.testExecutionIssueType, asString) ??
            options.testExecutionIssueType ??
            "Test Execution",
        testPlanIssueKey: testPlanIssueKey,
        testPlanIssueType:
            parse(env, ENV_NAMES.jira.testPlanIssueType, asString) ??
            options.testPlanIssueType ??
            "Test Plan",
        url: parse(env, ENV_NAMES.jira.url, asString) ?? options.url,
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
    options: CypressXrayPluginOptions["plugin"]
): InternalPluginOptions {
    return {
        debug: parse(env, ENV_NAMES.plugin.debug, asBoolean) ?? options?.debug ?? false,
        enabled: parse(env, ENV_NAMES.plugin.enabled, asBoolean) ?? options?.enabled ?? true,
        logDirectory:
            parse(env, ENV_NAMES.plugin.logDirectory, asString) ?? options?.logDirectory ?? "logs",
        normalizeScreenshotNames:
            parse(env, ENV_NAMES.plugin.normalizeScreenshotNames, asBoolean) ??
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
    options: CypressXrayPluginOptions["xray"]
): InternalXrayOptions {
    return {
        status: {
            failed: parse(env, ENV_NAMES.xray.status.failed, asString) ?? options?.status?.failed,
            passed: parse(env, ENV_NAMES.xray.status.passed, asString) ?? options?.status?.passed,
            pending:
                parse(env, ENV_NAMES.xray.status.pending, asString) ?? options?.status?.pending,
            skipped:
                parse(env, ENV_NAMES.xray.status.skipped, asString) ?? options?.status?.skipped,
        },
        testEnvironments:
            parse(env, ENV_NAMES.xray.testEnvironments, asArrayOfStrings) ??
            options?.testEnvironments,
        uploadResults:
            parse(env, ENV_NAMES.xray.uploadResults, asBoolean) ?? options?.uploadResults ?? true,
        uploadScreenshots:
            parse(env, ENV_NAMES.xray.uploadScreenshots, asBoolean) ??
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
    options: CypressXrayPluginOptions["cucumber"]
): Promise<InternalCucumberOptions | undefined> {
    // Check if the user has chosen to upload Cucumber results, too.
    const featureFileExtension =
        parse(config.env, ENV_NAMES.cucumber.featureFileExtension, asString) ??
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

                    ${errorMessage(error)}

                    The plugin depends on the package and should automatically download it during installation, but might have failed to do so because of conflicting Node versions

                    Make sure to install the package manually using: npm install @badeball/cypress-cucumber-preprocessor --save-dev
                `)
            );
        }
        LOG.message(
            Level.DEBUG,
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
                parse(config.env, ENV_NAMES.cucumber.downloadFeatures, asBoolean) ??
                options?.downloadFeatures ??
                false,
            featureFileExtension: featureFileExtension,
            preprocessor: preprocessorConfiguration,
            prefixes: {
                precondition:
                    parse(config.env, ENV_NAMES.cucumber.prefixes.precondition, asString) ??
                    options?.prefixes?.precondition,
                test:
                    parse(config.env, ENV_NAMES.cucumber.prefixes.test, asString) ??
                    options?.prefixes?.test,
            },
            uploadFeatures:
                parse(config.env, ENV_NAMES.cucumber.uploadFeatures, asBoolean) ??
                options?.uploadFeatures ??
                false,
        };
    }
    return undefined;
}

/**
 * Returns an {@link InternalSslOptions | `InternalOpenSSLOptions`} instance based on parsed
 * environment variables and a provided options object. Environment variables will take precedence
 * over the options set in the object.
 *
 * @param env - an object containing environment variables as properties
 * @param options - an options object containing OpenSSL options
 * @returns the constructed internal OpenSSL options
 */
export function initSslOptions(
    env: Cypress.ObjectLike,
    options: CypressXrayPluginOptions["openSSL"]
): InternalSslOptions {
    return {
        ["rootCAPath"]: parse(env, ENV_NAMES.openSSL.rootCAPath, asString) ?? options?.rootCAPath,
        secureOptions: parse(env, ENV_NAMES.openSSL.secureOptions, asInt) ?? options?.secureOptions,
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
    if (
        ENV_NAMES.authentication.jira.username in env &&
        ENV_NAMES.authentication.jira.apiToken in env
    ) {
        // Jira cloud authentication: username (Email) and token.
        LOG.message(
            Level.INFO,
            "Jira username and API token found. Setting up Jira cloud basic auth credentials"
        );
        const credentials = new BasicAuthCredentials(
            env[ENV_NAMES.authentication.jira.username] as string,
            env[ENV_NAMES.authentication.jira.apiToken] as string
        );
        await pingJiraInstance(jiraOptions.url, credentials);
        const jiraClient = new JiraClientCloud(jiraOptions.url, credentials);
        if (
            ENV_NAMES.authentication.xray.clientId in env &&
            ENV_NAMES.authentication.xray.clientSecret in env
        ) {
            // Xray cloud authentication: client ID and client secret.
            LOG.message(
                Level.INFO,
                "Xray client ID and client secret found. Setting up Xray cloud JWT credentials"
            );
            const xrayCredentials = new JwtCredentials(
                env[ENV_NAMES.authentication.xray.clientId] as string,
                env[ENV_NAMES.authentication.xray.clientSecret] as string,
                `${XrayClientCloud.URL}/authenticate`
            );
            await pingXrayCloud(xrayCredentials);
            const xrayClient = new XrayClientCloud(xrayCredentials);
            return {
                kind: "cloud",
                jiraClient: jiraClient,
                xrayClient: xrayClient,
            };
        } else {
            throw new Error(
                dedent(`
                    Failed to configure Xray client: Jira cloud credentials detected, but the provided Xray credentials are not Xray cloud credentials
                    You can find all configurations currently supported at: ${HELP.plugin.configuration.authentication.root}
                `)
            );
        }
    } else if (ENV_NAMES.authentication.jira.apiToken in env && jiraOptions.url) {
        // Jira server authentication: no username, only token.
        LOG.message(Level.INFO, "Jira PAT found. Setting up Jira server PAT credentials");
        const credentials = new PatCredentials(
            env[ENV_NAMES.authentication.jira.apiToken] as string
        );
        await pingJiraInstance(jiraOptions.url, credentials);
        const jiraClient = new JiraClientServer(jiraOptions.url, credentials);
        // Xray server authentication: no username, only token.
        LOG.message(Level.INFO, "Jira PAT found. Setting up Xray server PAT credentials");
        await pingXrayServer(jiraOptions.url, credentials);
        const xrayClient = new XrayClientServer(jiraOptions.url, credentials);
        return {
            kind: "server",
            jiraClient: jiraClient,
            xrayClient: xrayClient,
        };
    } else if (
        ENV_NAMES.authentication.jira.username in env &&
        ENV_NAMES.authentication.jira.password in env &&
        jiraOptions.url
    ) {
        LOG.message(
            Level.INFO,
            "Jira username and password found. Setting up Jira server basic auth credentials"
        );
        const credentials = new BasicAuthCredentials(
            env[ENV_NAMES.authentication.jira.username] as string,
            env[ENV_NAMES.authentication.jira.password] as string
        );
        await pingJiraInstance(jiraOptions.url, credentials);
        const jiraClient = new JiraClientServer(jiraOptions.url, credentials);
        LOG.message(
            Level.INFO,
            "Jira username and password found. Setting up Xray server basic auth credentials"
        );
        await pingXrayServer(jiraOptions.url, credentials);
        const xrayClient = new XrayClientServer(jiraOptions.url, credentials);
        return {
            kind: "server",
            jiraClient: jiraClient,
            xrayClient: xrayClient,
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
