import axios from "axios";
import type { HttpCredentials } from "./client/authentication/credentials";
import {
    BasicAuthCredentials,
    JwtCredentials,
    PatCredentials,
} from "./client/authentication/credentials";
import { AxiosRestClient } from "./client/https/requests";
import type { JiraClient } from "./client/jira/jira-client";
import { BaseJiraClient } from "./client/jira/jira-client";
import { XrayClientCloud } from "./client/xray/xray-client-cloud";
import type { XrayClientServer } from "./client/xray/xray-client-server";
import { ServerClient } from "./client/xray/xray-client-server";
import { ENV_NAMES } from "./env";
import type { Command } from "./hooks/command";
import type { ObjectLike, PluginConfigOptions, ScreenshotDetails } from "./types/cypress";
import type {
    ClientCombination,
    CypressXrayPluginOptions,
    HttpClientCombination,
    InternalCucumberOptions,
    InternalCypressXrayPluginOptions,
    InternalHttpOptions,
    InternalJiraOptions,
    InternalPluginOptions,
    InternalXrayOptions,
} from "./types/plugin";
import type { XrayEvidenceItem } from "./types/xray/import-test-execution-results";
import { dedent } from "./util/dedent";
import type { CucumberPreprocessorArgs, CucumberPreprocessorExports } from "./util/dependencies";
import dependencies from "./util/dependencies";
import { errorMessage } from "./util/errors";
import type { ExecutableGraph } from "./util/graph/executable-graph";
import { HELP } from "./util/help";
import type { Logger } from "./util/logging";
import { LOG } from "./util/logging";
import { asArrayOfStrings, asBoolean, asObject, asString, parse } from "./util/parsing";

export class PluginContext
    implements EvidenceCollection, IterationParameterCollection, ScreenshotCollection
{
    private readonly clients: ClientCombination;
    private readonly internalOptions: InternalCypressXrayPluginOptions;
    private readonly cypressOptions: PluginConfigOptions;
    private readonly evidenceCollection: EvidenceCollection;
    private readonly iterationParameterCollection: IterationParameterCollection;
    private readonly screenshotCollection: ScreenshotCollection;
    private readonly graph: ExecutableGraph<Command>;
    private readonly logger: Logger;

    constructor(
        clients: ClientCombination,
        internalOptions: InternalCypressXrayPluginOptions,
        cypressOptions: PluginConfigOptions,
        evidenceCollection: EvidenceCollection,
        iterationParameterCollection: IterationParameterCollection,
        screenshotCollection: ScreenshotCollection,
        graph: ExecutableGraph<Command>,
        logger: Logger
    ) {
        this.clients = clients;
        this.internalOptions = internalOptions;
        this.cypressOptions = cypressOptions;
        this.evidenceCollection = evidenceCollection;
        this.iterationParameterCollection = iterationParameterCollection;
        this.screenshotCollection = screenshotCollection;
        this.graph = graph;
        this.logger = logger;
    }

    public getClients(): ClientCombination {
        return this.clients;
    }

    public getOptions(): InternalCypressXrayPluginOptions {
        return this.internalOptions;
    }

    public getCypressOptions(): PluginConfigOptions {
        return this.cypressOptions;
    }

    public getGraph(): ExecutableGraph<Command> {
        return this.graph;
    }

    public getLogger(): Logger {
        return this.logger;
    }

    public addScreenshot(screenshot: ScreenshotDetails) {
        this.screenshotCollection.addScreenshot(screenshot);
    }

    public getScreenshots(): ScreenshotDetails[] {
        return this.screenshotCollection.getScreenshots();
    }

    public addEvidence(issueKey: string, evidence: Required<XrayEvidenceItem>): void {
        this.evidenceCollection.addEvidence(issueKey, evidence);
        LOG.message("debug", `Added evidence for test ${issueKey}: ${evidence.filename}`);
    }

    public getEvidence(issueKey: string): XrayEvidenceItem[] {
        return this.evidenceCollection.getEvidence(issueKey);
    }

    public setIterationParameters(
        issueKey: string,
        testId: string,
        parameters: Record<string, string>
    ): void {
        this.iterationParameterCollection.setIterationParameters(issueKey, testId, parameters);
    }

    public getIterationParameters(issueKey: string, testId: string): Record<string, string> {
        return this.iterationParameterCollection.getIterationParameters(issueKey, testId);
    }
}

export interface EvidenceCollection {
    addEvidence(issueKey: string, evidence: Required<XrayEvidenceItem>): void;
    getEvidence(issueKey: string): XrayEvidenceItem[];
}

export class SimpleEvidenceCollection {
    private readonly collectedEvidence = new Map<string, XrayEvidenceItem[]>();
    addEvidence(issueKey: string, evidence: XrayEvidenceItem): void {
        const currentEvidence = this.collectedEvidence.get(issueKey);
        if (!currentEvidence) {
            this.collectedEvidence.set(issueKey, [evidence]);
        } else {
            currentEvidence.push(evidence);
        }
    }
    getEvidence(issueKey: string): XrayEvidenceItem[] {
        return this.collectedEvidence.get(issueKey) ?? [];
    }
}

export interface IterationParameterCollection {
    getIterationParameters(issueKey: string, testId: string): Record<string, string>;
    setIterationParameters(
        issueKey: string,
        testId: string,
        parameters: Record<string, string>
    ): void;
}

export class SimpleIterationParameterCollection implements IterationParameterCollection {
    private readonly collectedParameters = new Map<string, Map<string, Record<string, string>>>();
    public setIterationParameters(
        issueKey: string,
        testId: string,
        parameters: Record<string, string>
    ): void {
        let issueTests = this.collectedParameters.get(issueKey);
        if (!issueTests) {
            issueTests = new Map<string, Record<string, string>>();
            this.collectedParameters.set(issueKey, issueTests);
        }
        issueTests.set(testId, parameters);
    }
    public getIterationParameters(issueKey: string, testId: string): Record<string, string> {
        return this.collectedParameters.get(issueKey)?.get(testId) ?? {};
    }
}

export interface ScreenshotCollection {
    addScreenshot(screenshot: ScreenshotDetails): void;
    getScreenshots(): ScreenshotDetails[];
}

export class SimpleScreenshotCollection implements ScreenshotCollection {
    private readonly screenshots: ScreenshotDetails[] = [];
    public addScreenshot(screenshot: ScreenshotDetails): void {
        this.screenshots.push(screenshot);
    }
    public getScreenshots(): ScreenshotDetails[] {
        return this.screenshots;
    }
}

let context: PluginContext | undefined = undefined;

function getGlobalContext(): PluginContext | undefined {
    return context;
}

function setGlobalContext(newContext?: PluginContext): void {
    context = newContext;
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
function initJiraOptions(
    env: ObjectLike,
    options: CypressXrayPluginOptions["jira"]
): InternalJiraOptions {
    const projectKey = parse(env, ENV_NAMES.jira.projectKey, asString) ?? options.projectKey;
    if (!projectKey) {
        throw new Error("Plugin misconfiguration: Jira project key was not set");
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
        },
        projectKey: projectKey,
        testExecutionIssue:
            parse(env, ENV_NAMES.jira.testExecutionIssue, asObject) ?? options.testExecutionIssue,
        testExecutionIssueDescription:
            parse(env, ENV_NAMES.jira.testExecutionIssueDescription, asString) ??
            options.testExecutionIssueDescription,
        testExecutionIssueKey:
            parse(env, ENV_NAMES.jira.testExecutionIssueKey, asString) ??
            options.testExecutionIssueKey,
        testExecutionIssueSummary:
            parse(env, ENV_NAMES.jira.testExecutionIssueSummary, asString) ??
            options.testExecutionIssueSummary,
        testExecutionIssueType:
            parse(env, ENV_NAMES.jira.testExecutionIssueType, asString) ??
            options.testExecutionIssueType ??
            "Test Execution",
        testPlanIssueKey:
            parse(env, ENV_NAMES.jira.testPlanIssueKey, asString) ?? options.testPlanIssueKey,
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
function initPluginOptions(
    env: ObjectLike,
    options: CypressXrayPluginOptions["plugin"]
): InternalPluginOptions {
    return {
        debug: parse(env, ENV_NAMES.plugin.debug, asBoolean) ?? options?.debug ?? false,
        enabled: parse(env, ENV_NAMES.plugin.enabled, asBoolean) ?? options?.enabled ?? true,
        logDirectory:
            parse(env, ENV_NAMES.plugin.logDirectory, asString) ?? options?.logDirectory ?? "logs",
        logger: options?.logger,
        normalizeScreenshotNames:
            parse(env, ENV_NAMES.plugin.normalizeScreenshotNames, asBoolean) ??
            options?.normalizeScreenshotNames ??
            false,
        splitUpload:
            parse(env, ENV_NAMES.plugin.splitUpload, asBoolean) ?? options?.splitUpload ?? false,
        uploadLastAttempt:
            parse(env, ENV_NAMES.plugin.uploadLastAttempt, asBoolean) ??
            options?.uploadLastAttempt ??
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
function initXrayOptions(
    env: ObjectLike,
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
            step: {
                failed:
                    parse(env, ENV_NAMES.xray.status.step.failed, asString) ??
                    options?.status?.step?.failed,
                passed:
                    parse(env, ENV_NAMES.xray.status.step.passed, asString) ??
                    options?.status?.step?.passed,
                pending:
                    parse(env, ENV_NAMES.xray.status.step.pending, asString) ??
                    options?.status?.step?.pending,
                skipped:
                    parse(env, ENV_NAMES.xray.status.step.skipped, asString) ??
                    options?.status?.step?.skipped,
            },
        },
        testEnvironments:
            parse(env, ENV_NAMES.xray.testEnvironments, asArrayOfStrings) ??
            options?.testEnvironments,
        uploadRequests:
            parse(env, ENV_NAMES.xray.uploadRequests, asBoolean) ??
            options?.uploadRequests ??
            false,
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
async function initCucumberOptions(
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
            preprocessor = await dependencies.importOptionalDependency<CucumberPreprocessorExports>(
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
            "debug",
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
            prefixes: {
                precondition:
                    parse(config.env, ENV_NAMES.cucumber.prefixes.precondition, asString) ??
                    options?.prefixes?.precondition,
                test:
                    parse(config.env, ENV_NAMES.cucumber.prefixes.test, asString) ??
                    options?.prefixes?.test,
            },
            preprocessor: preprocessorConfiguration,
            uploadFeatures:
                parse(config.env, ENV_NAMES.cucumber.uploadFeatures, asBoolean) ??
                options?.uploadFeatures ??
                false,
        };
    }
    return undefined;
}

function initHttpClients(
    pluginOptions?: Pick<InternalPluginOptions, "debug">,
    httpOptions?: InternalHttpOptions
): HttpClientCombination {
    let jiraClient: AxiosRestClient | undefined = undefined;
    let xrayClient: AxiosRestClient | undefined = undefined;
    if (httpOptions) {
        const { jira, rateLimiting: rateLimitingCommon, xray, ...httpConfigCommon } = httpOptions;
        if (jira) {
            const { rateLimiting: rateLimitingJira, ...httpConfig } = jira;
            jiraClient = new AxiosRestClient(axios, {
                debug: pluginOptions?.debug,
                http: {
                    ...httpConfigCommon,
                    ...httpConfig,
                },
                rateLimiting: rateLimitingJira ?? rateLimitingCommon,
            });
        }
        if (xray) {
            const { rateLimiting: rateLimitingXray, ...httpConfig } = xray;
            xrayClient = new AxiosRestClient(axios, {
                debug: pluginOptions?.debug,
                http: {
                    ...httpConfigCommon,
                    ...httpConfig,
                },
                rateLimiting: rateLimitingXray ?? rateLimitingCommon,
            });
        }
        if (!jiraClient || !xrayClient) {
            const httpClient = new AxiosRestClient(axios, {
                debug: pluginOptions?.debug,
                http: httpConfigCommon,
                rateLimiting: rateLimitingCommon,
            });
            if (!jiraClient) {
                jiraClient = httpClient;
            }
            if (!xrayClient) {
                xrayClient = httpClient;
            }
        }
    } else {
        const httpClient = new AxiosRestClient(axios, {
            debug: pluginOptions?.debug,
        });
        jiraClient = httpClient;
        xrayClient = httpClient;
    }
    return {
        jira: jiraClient,
        xray: xrayClient,
    };
}

async function initClients(
    jiraOptions: InternalJiraOptions,
    env: ObjectLike,
    httpClients: HttpClientCombination
): Promise<ClientCombination> {
    if (
        ENV_NAMES.authentication.jira.username in env &&
        ENV_NAMES.authentication.jira.apiToken in env
    ) {
        LOG.message(
            "info",
            "Jira username and API token found. Setting up Jira cloud basic auth credentials."
        );
        const credentials = new BasicAuthCredentials(
            env[ENV_NAMES.authentication.jira.username] as string,
            env[ENV_NAMES.authentication.jira.apiToken] as string
        );
        const jiraClient = await getJiraClient(jiraOptions.url, credentials, httpClients.jira);
        if (
            ENV_NAMES.authentication.xray.clientId in env &&
            ENV_NAMES.authentication.xray.clientSecret in env
        ) {
            LOG.message(
                "info",
                "Xray client ID and client secret found. Setting up Xray cloud JWT credentials."
            );
            const xrayCredentials = new JwtCredentials(
                env[ENV_NAMES.authentication.xray.clientId] as string,
                env[ENV_NAMES.authentication.xray.clientSecret] as string,
                `${XrayClientCloud.URL}/authenticate`,
                httpClients.xray
            );
            const xrayClient = await getXrayCloudClient(xrayCredentials, httpClients.xray);
            return {
                jiraClient: jiraClient,
                kind: "cloud",
                xrayClient: xrayClient,
            };
        }
        throw new Error(
            dedent(`
                Failed to configure Xray client: Jira cloud credentials detected, but the provided Xray credentials are not Xray cloud credentials.

                  You can find all configurations currently supported at: ${HELP.plugin.configuration.authentication.root}
            `)
        );
    } else if (ENV_NAMES.authentication.jira.apiToken in env) {
        LOG.message("info", "Jira PAT found. Setting up Jira server PAT credentials.");
        const credentials = new PatCredentials(
            env[ENV_NAMES.authentication.jira.apiToken] as string
        );
        const jiraClient = await getJiraClient(jiraOptions.url, credentials, httpClients.jira);
        LOG.message("info", "Jira PAT found. Setting up Xray server PAT credentials.");
        const xrayClient = await getXrayServerClient(
            jiraOptions.url,
            credentials,
            httpClients.xray
        );
        return {
            jiraClient: jiraClient,
            kind: "server",
            xrayClient: xrayClient,
        };
    } else if (
        ENV_NAMES.authentication.jira.username in env &&
        ENV_NAMES.authentication.jira.password in env
    ) {
        LOG.message(
            "info",
            "Jira username and password found. Setting up Jira server basic auth credentials."
        );
        const credentials = new BasicAuthCredentials(
            env[ENV_NAMES.authentication.jira.username] as string,
            env[ENV_NAMES.authentication.jira.password] as string
        );
        const jiraClient = await getJiraClient(jiraOptions.url, credentials, httpClients.jira);
        LOG.message(
            "info",
            "Jira username and password found. Setting up Xray server basic auth credentials."
        );
        const xrayClient = await getXrayServerClient(
            jiraOptions.url,
            credentials,
            httpClients.xray
        );
        return {
            jiraClient: jiraClient,
            kind: "server",
            xrayClient: xrayClient,
        };
    }
    throw new Error(
        dedent(`
            Failed to configure Jira client: No viable authentication method was configured.

              You can find all configurations currently supported at: ${HELP.plugin.configuration.authentication.root}
        `)
    );
}

async function getXrayCloudClient(
    credentials: JwtCredentials,
    httpClient: AxiosRestClient
): Promise<XrayClientCloud> {
    const xrayClient = new XrayClientCloud(credentials, httpClient);
    try {
        await credentials.getAuthorizationHeader();
        LOG.message(
            "debug",
            dedent(`
                Successfully established communication with: ${credentials.getAuthenticationUrl()}

                  The provided credentials belong to a user with a valid Xray license.
            `)
        );
    } catch (error: unknown) {
        throw new Error(
            dedent(`
                Failed to establish communication with Xray: ${credentials.getAuthenticationUrl()}

                  ${errorMessage(error)}

                Make sure you have correctly set up:
                - Xray cloud authentication: ${HELP.plugin.configuration.authentication.xray.cloud}
                - Xray itself: ${HELP.xray.installation.cloud}

                For more information, set the plugin to debug mode: ${
                    HELP.plugin.configuration.plugin.debug
                }
            `)
        );
    }
    return xrayClient;
}

async function getXrayServerClient(
    url: string,
    credentials: BasicAuthCredentials | PatCredentials,
    httpClient: AxiosRestClient
): Promise<XrayClientServer> {
    const xrayClient = new ServerClient(url, credentials, httpClient);
    try {
        const license = await xrayClient.getXrayLicense();
        if (typeof license === "object" && "active" in license) {
            if (license.active) {
                LOG.message(
                    "debug",
                    dedent(`
                        Successfully established communication with: ${url}

                          Xray license is active: ${license.licenseType}
                    `)
                );
                return xrayClient;
            } else {
                throw new Error("The Xray license is not active");
            }
        }
        throw new Error(
            dedent(`
                Xray did not return a valid response: JSON containing basic Xray license information was expected, but not received.
            `)
        );
    } catch (error: unknown) {
        throw new Error(
            dedent(`
                Failed to establish communication with Xray: ${url}

                  ${errorMessage(error)}

                Make sure you have correctly set up:
                - Jira base URL: ${HELP.plugin.configuration.jira.url}
                - Xray server authentication: ${
                    HELP.plugin.configuration.authentication.xray.server
                }
                - Xray itself: ${HELP.xray.installation.server}

                For more information, set the plugin to debug mode: ${
                    HELP.plugin.configuration.plugin.debug
                }
            `)
        );
    }
}

async function getJiraClient(
    url: string,
    credentials: HttpCredentials,
    httpClient: AxiosRestClient
): Promise<JiraClient> {
    const jiraClient = new BaseJiraClient(url, credentials, httpClient);
    try {
        const userDetails = await jiraClient.getMyself();
        const username = userDetails.displayName ?? userDetails.emailAddress ?? userDetails.name;
        if (username) {
            LOG.message(
                "debug",
                dedent(`
                    Successfully established communication with: ${url}

                      The provided Jira credentials belong to: ${username}
               `)
            );
            return jiraClient;
        } else {
            throw new Error(
                dedent(`
                Jira did not return a valid response: JSON containing a username was expected, but not received.
            `)
            );
        }
    } catch (error: unknown) {
        throw new Error(
            dedent(`
                Failed to establish communication with Jira: ${url}

                  ${errorMessage(error)}

                Make sure you have correctly set up:
                - Jira base URL: ${HELP.plugin.configuration.jira.url}
                - Jira authentication: ${HELP.plugin.configuration.authentication.jira.root}

                For more information, set the plugin to debug mode: ${
                    HELP.plugin.configuration.plugin.debug
                }
            `)
        );
    }
}

/**
 * Workaround until module mocking becomes a stable feature. The current approach allows replacing
 * the functions with a mocked one.
 *
 * @see https://nodejs.org/docs/latest-v23.x/api/test.html#mockmodulespecifier-options
 */
export default {
    getGlobalContext,
    initClients,
    initCucumberOptions,
    initHttpClients,
    initJiraOptions,
    initPluginOptions,
    initXrayOptions,
    setGlobalContext,
};
