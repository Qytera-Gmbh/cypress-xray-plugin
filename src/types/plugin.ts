import { JiraClientCloud } from "../client/jira/jiraClientCloud";
import { JiraClientServer } from "../client/jira/jiraClientServer";
import { XrayClientCloud } from "../client/xray/xrayClientCloud";
import { XrayClientServer } from "../client/xray/xrayClientServer";
import { OneOf } from "./util";

export interface Options {
    jira: JiraOptions;
    plugin?: PluginOptions;
    xray?: XrayOptions;
    cucumber?: CucumberOptions;
    openSSL?: OpenSSLOptions;
}

export interface JiraOptions {
    /**
     * The Jira project key.
     *
     * @example "CYP"
     */
    projectKey: string;
    /**
     * Whether any videos Cypress captured during test execution should be attached to the test
     * execution issue on results upload.
     */
    attachVideos?: boolean;
    /**
     * The description of the test execution issue, which will be used both for new test execution
     * issues as well as for updating existing issues (if provided through
     * {@link JiraOptions.testExecutionIssueKey}).
     *
     * If omitted, test execution issues will have the following description:
     * ```ts
     * `Cypress version: ${cypressVersion} Browser: ${browserName} (${browserVersion})`
     * ```
     */
    testExecutionIssueDescription?: string;
    /**
     * An execution issue key to attach run results to. If omitted, Jira will always create a new
     * test execution issue with each upload.
     *
     * Note: it must be prefixed with the project key.
     *
     * @example "CYP-123"
     */
    testExecutionIssueKey?: string;
    /**
     * The summary of the test execution issue, which will be used both for new test execution
     * issues as well as for updating existing issues (if provided through
     * {@link JiraOptions.testExecutionIssueKey}).
     *
     * If omitted, test execution issues will be named as follows:
     * ```ts
     * `Execution Results [${t}]`,
     * ```
     * where `t` is the timestamp when Cypress started testing.
     */
    testExecutionIssueSummary?: string;
    /**
     * A test plan issue key to attach the execution to.
     *
     * Note: it must be prefixed with the project key.
     *
     * @example "CYP-567"
     */
    testPlanIssueKey?: string;
    /**
     * Use this parameter to specify the base URL of your Jira instance.
     *
     * @example "https://example.org/development/jira" // Jira server
     * @example "https://your-domain.atlassian.net" // Jira cloud
     */
    url?: string;
}

export interface XrayStepOptions {
    /**
     * The maximum length a step's action description can have in terms of characters. Some Xray
     * instances might enforce limits on the length and reject step updates in case the action's
     * description exceeds said limit.
     */
    maxLengthAction?: number;
    /**
     * Whether to update a manual test issue's test steps during execution results upload. If set
     * to true, **all** existing steps will be replaced with the plugin's steps.
     *
     * Note: the plugin currently creates only one step containing the code of the corresponding
     * Cypress test function.
     *
     * Note: steps of existing issues can only be updated if
     * {@link PluginOptions.overwriteIssueSummary} is enabled as well, since Xray requires an issue
     * summary whenever test details are updated.
     */
    update?: boolean;
}

export interface XrayOptions {
    /**
     * The Xray status name of a test marked as failed by Cypress. Should be used when custom status
     * names have been setup in Xray.
     *
     * @example "FEHLGESCHLAGEN" // german
     */
    statusFailed?: string;
    /**
     * The Xray status name of a test marked as passed by Cypress. Should be used when custom status
     * names have been setup in Xray.
     *
     * @example "BESTANDEN" // german
     */
    statusPassed?: string;
    /**
     * The Xray status name of a test marked as pending by Cypress. Should be used when custom
     * status names have been setup in Xray.
     *
     * @example "EN_ATTENTE" // french
     */
    statusPending?: string;
    /**
     * The Xray status name of a test marked as skipped by Cypress. Should be used when custom
     * status names have been setup in Xray.
     *
     * @example "OMIT" // french
     */
    statusSkipped?: string;
    /**
     * All options related to manual test issue steps.
     */
    steps?: XrayStepOptions;
    /**
     * Turns execution results upload on or off. Useful when switching upload on or off from the
     * command line (via environment variables).
     */
    uploadResults?: boolean;
    /**
     * Turns on or off the upload of screenshots Cypress takes during test execution.
     */
    uploadScreenshots?: boolean;
}

export interface CucumberOptions {
    /**
     * The file extension of feature files you want to run in Cypress. The plugin will use this to
     * parse all matching files with to extract any tags contained within them. Such tags are
     * needed to identify to which test issue a feature file belongs.
     *
     * @example ".cy.feature"
     */
    featureFileExtension: string;
    /**
     * Set it to true to automatically download feature files from Xray for Cypress to execute.
     *
     * Note: Enable this option if the source of truth for test cases are step definitions in Xray
     * and Cypress is only used for running tests.
     */
    downloadFeatures?: boolean;
    /**
     * Set it to true to automatically create or update existing Xray issues (summary, steps),
     * based on the feature file executed by Cypress.
     *
     * Note: Enable this option if the source of truth for test cases are local feature files in
     * Cypress and Xray is only used for tracking execution status/history.
     */
    uploadFeatures?: boolean;
}

export interface PluginOptions {
    /**
     * Enables or disables the entire plugin. Setting this option to `false` disables all plugin
     * functions, including authentication checks, uploads or feature file synchronization.
     */
    enabled?: boolean;
    /**
     * Turns on or off extensive debugging output.
     */
    debug?: boolean;
    /**
     * The directory which all error and debug log files will be written to.
     */
    logDirectory?: string;
    /**
     * Some Xray setups might struggle with uploaded evidence if the filenames contain non-ASCII
     * characters. With this option enabled, the plugin only allows characters `a-zA-Z0-9.` in
     * screenshot names and replaces all other sequences with `_`.
     */
    normalizeScreenshotNames?: boolean;
    /**
     * Decide whether to keep the issues' existing summaries or whether to overwrite them with
     * each upload.
     */
    overwriteIssueSummary?: boolean;
}

export interface OpenSSLOptions {
    /**
     * Specify the path to a root CA in .pem format. This will then be used to authenticate against
     * the Xray instance.
     */
    rootCAPath?: string;
    /**
     * A {@link https://nodejs.org/api/crypto.html#crypto-constants crypto constant} that will be
     * used to configure the `securityOptions` of the
     * {@link https://nodejs.org/api/https.html#class-httpsagent https.Agent} used for sending
     * requests to your Xray instance.
     *
     * Note: Compute their bitwise OR if you need to set more than one option.
     *
     * @example
     * import { constants } from "crypto";
     * // ...
     *   openSSL: {
     *     secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT |
     *                    constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION
     *   }
     * // ...
     */
    secureOptions?: number;
}

/**
 * Options only intended for internal plugin use.
 */
export type InternalOptions = Options & {
    cucumber?: {
        /**
         * A mapping of scenario titles to Xray issue keys. Built during file preprocessing, used
         * during results upload.
         *
         * @example
         *   '@PRJ-1234'
         *   'Scenario: Valid Login'
         *   '[...]'
         *
         *   issues: {
         *     "Valid Login": "PRJ-1234"
         *   }
         */
        issues?: {
            [key: string]: string;
        };
    };
};

export interface PluginContext {
    xrayClient?: OneOf<[XrayClientServer, XrayClientCloud]>;
    jiraClient?: OneOf<[JiraClientServer, JiraClientCloud]>;
    internal: InternalOptions;
    cypress: Cypress.PluginConfigOptions;
}
