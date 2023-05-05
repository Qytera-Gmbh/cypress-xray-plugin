import { JiraClient } from "../../client/jira/jiraClient";
import { XrayClientCloud } from "../../client/xray/xrayClientCloud";
import { XrayClientServer } from "../../client/xray/xrayClientServer";

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
     * @example "CYP"
     */
    projectKey: string;
    /**
     * Use this parameter to specify the URL of your Jira instance.
     *
     * @example "https://example.org/development/jira"
     * @example "https://your-domain.atlassian.net"
     */
    serverUrl?: string;
    /**
     * An execution issue key to attach run results to. If omitted, Jira
     * will always create a new test execution issue with each upload.
     *
     * Note: it must be prefixed with the project key.
     *
     * @example "CYP-123"
     */
    testExecutionIssueKey?: string;
    /**
     * A test plan issue key to attach the execution to.
     *
     * Note: it must be prefixed with the project key.
     *
     * @example "CYP-567"
     */
    testPlanIssueKey?: string;
    /**
     * Whether any video Cypress captures during test execution should be
     * attached to the test execution issue on results upload.
     */
    attachVideo?: boolean;
}

export interface XrayOptions {
    /**
     * Turns execution results upload on or off. Useful when switching upload
     * on or off from the command line (via environment variables).
     */
    uploadResults?: boolean;
    /**
     * Turns on or off the upload of screenshots Cypress takes during test
     * execution.
     */
    uploadScreenshots?: boolean;
    /**
     * The status name of a test marked as passed in Xray. Should be used
     * when custom status names have been setup in Xray.
     *
     * @example "BESTANDEN" // german
     */
    statusPassed?: string;
    /**
     * The status name of a test marked as failed in Xray. Should be used
     * when custom status names have been setup in Xray.
     *
     * @example "FEHLGESCHLAGEN" // german
     */
    statusFailed?: string;
    /**
     * The test type of the test issues. This option will be used to set the
     * corresponding field on issues created during upload (happens when a test
     * does not yet have a corresponding Xray issue).
     * issue
     *
     * @example "Manual"
     */
    testType?: string;
}

export interface CucumberOptions {
    /**
     * The file extension of feature files you want to run in Cypress. The
     * plugin will use this to parse all matching files with to extract any
     * tags contained within them. Such tags are needed to identify to which
     * test issue a feature file belongs.
     *
     * @example ".cy.feature"
     */
    featureFileExtension: string;
    /**
     * A mapping of scenario titles to Xray issue keys. It is recommended to add
     * tags containing the issue key to your scenarios instead of manually
     * defining to which issue a scenario belongs.
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
    /**
     * Set it to true to automatically create or update existing Xray issues
     * (summary, steps), based on the feature file executed by Cypress.
     *
     * Note: Enable this option if the source of truth for test cases are local
     * feature files in Cypress and Xray is only used for tracking execution
     * status/history.
     */
    uploadFeatures?: boolean;
    /**
     * Set it to true to automatically download feature files from Xray for
     * Cypress to execute.
     *
     * Note: Enable this option if the source of truth for test cases are step
     * definitions in Xray and Cypress is only used for running tests.
     */
    downloadFeatures?: boolean;
}

export interface PluginOptions {
    /**
     * Decide whether to keep the issues' existing summaries or whether to
     * overwrite them with each upload.
     */
    overwriteIssueSummary?: boolean;
    /**
     * Some Xray setups might struggle with uploaded evidence if the filenames
     * contain non-ASCII characters. With this option enabled, the plugin only
     * allows characters `a-zA-Z0-9.` in screenshot names and replaces all
     * other sequences with `_`.
     */
    normalizeScreenshotNames?: boolean;
}

export interface OpenSSLOptions {
    /**
     * Specify the path to a root CA in .pem format. This will then be used
     * to authenticate against the Xray instance.
     */
    rootCAPath?: string;
    /**
     * A {@link https://nodejs.org/api/crypto.html#crypto-constants crypto constant}
     * that will be used to configure the `securityOptions` of the
     * {@link https://nodejs.org/api/https.html#class-httpsagent https.Agent}
     * used for sending requests to your Xray instance.
     *
     * Note: Compute their bitwise OR if you need to set more than one
     * option.
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

export interface PluginContext {
    xrayClient?: XrayClientServer | XrayClientCloud;
    jiraClient?: JiraClient;
    config: Options;
}
