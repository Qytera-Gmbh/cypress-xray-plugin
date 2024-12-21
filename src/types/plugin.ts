import type { IPreprocessorConfiguration } from "@badeball/cypress-cucumber-preprocessor";
import type { AxiosRequestConfig } from "axios";
import type { AxiosRestClient, RequestsOptions } from "../client/https/requests";
import type { JiraClient } from "../client/jira/jira-client";
import type { XrayClient } from "../client/xray/xray-client";
import type { IssueUpdate } from "./jira/responses/issue-update";

/**
 * Models all options for configuring the behaviour of the plugin.
 */
export interface CypressXrayPluginOptions {
    /**
     * When Cucumber is enabled, you can use these options to configure how the plugin works with
     * your feature files.
     *
     * @see https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/
     */
    cucumber?: CucumberOptions;
    /**
     * HTTP configuration to be used for requests made by the plugin. You can set default options to be
     * used for all requests and override them with individual options for Jira or Xray.
     *
     * @example
     *
     * ```ts
     * {
     *   // ...other plugin options
     *   http: {
     *     timeout: 5000,
     *     jira: {
     *       proxy: {
     *         host: "http://1.2.3.4",
     *         port: 12345
     *       }
     *     },
     *     xray: {
     *       timeout: 10000,
     *     }
     *   }
     * }
     * ```
     *
     * @see https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/http
     */
    http?: HttpOptions;
    /**
     * Defines Jira-specific options that control how the plugin interacts with Jira.
     *
     * @see https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/
     */
    jira: JiraOptions;
    /**
     * Options for configuring the general behaviour of the plugin.
     *
     * @see https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/plugin/
     */
    plugin?: PluginOptions;
    /**
     * Xray settings that may be required depending on your project configuration.
     *
     * @see https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/xray/
     */
    xray?: XrayOptions;
}

export interface JiraFieldIds {
    /**
     * The Jira issue description field ID.
     *
     * @deprecated Will be removed in version `8.0.0`. `description` is a system field and will
     * always have ID `description`.
     */
    description?: string;
    /**
     * The Jira issue labels field ID.
     *
     * @deprecated Will be removed in version `8.0.0`. `labels` is a system field and will
     * always have ID `labels`.
     */
    labels?: string;
    /**
     * The Jira issue summary field ID (i.e. the title of the issues).
     *
     * @deprecated Will be removed in version `8.0.0`. `summary` is a system field and will always
     * have ID `summary`.
     */
    summary?: string;
    /**
     * The Xray test environments field ID (i.e. the test environments associated with test
     * execution issues).
     *
     * *Note: This option is required for server instances only. Xray cloud provides ways to
     * retrieve test environment field information independently of Jira.*
     */
    testEnvironments?: string;
    /**
     * The Jira field ID of test plans in Xray test (execution) issues.
     *
     * *Note: This option is required for server instances only. Xray cloud provides ways to
     * retrieve test plan field information independently of Jira.*
     */
    testPlan?: string;
}

/**
 * Wrapper type around Jira's issue update type with some additional properties.
 */
export type PluginIssueUpdate = IssueUpdate & {
    /**
     * An execution issue key to attach run results to. If omitted, Xray will always create
     * a new test execution issue with each upload.
     *
     * @example "CYP-123"
     */
    key?: string;
};

/**
 * Jira-specific options that control how the plugin interacts with Jira.
 */
export interface JiraOptions {
    /**
     * Whether any videos Cypress captured during test execution should be attached to the test
     * execution issue on results upload.
     */
    attachVideos?: boolean;
    /**
     * Jira Field IDs to make all fields required during the upload process uniquely identifiable.
     *
     * By default, the plugin accesses field information using the fields' names (`Summary`,
     * `Description`, ...) just fine. Still, providing the fields' IDs here might become necessary
     * in the following scenarios:
     * - Your Jira language setting is a language other than English. For example, when the plugin
     * tries to access the `Test Plan` field and the Jira language is set to French, access will
     * fail because Jira only provides access to a field called `Plan de Test` instead.
     * - Your Jira project contains several fields with identical names.
     *
     * *Note: In case you don't know these properties or if you are unsure whether they are really
     * needed, the plugin will try to provide lists of field candidates in case any errors occur.
     * You can then extract all required information from these candidates.*
     *
     * *Please consult the official documentation for more information about field IDs: https://confluence.atlassian.com/jirakb/how-to-find-id-for-custom-field-s-744522503.html*
     *
     * @example
     * ```ts
     *   fields: {
     *     testPlan: "customfield_12643"
     *   }
     * ```
     */
    fields?: JiraFieldIds;
    /**
     * The Jira project key.
     *
     * @example "CYP"
     */
    projectKey: string;
    /**
     * This option can be used to configure the test execution issue that the plugin will either
     * create or modify with the run results. The value must match the format of Jira's issue
     * create/update payloads.
     *
     * ```ts
     * testExecutionIssue: {
     *   key: "PRJ-16",
     *   fields: {
     *     summary: "My execution issue summary",
     *     description: "My execution issue description",
     *     assignee: {
     *       name: "cool.turtle@company.com"
     *     },
     *     customfield_12345: "Sprint 17"
     *   }
     * }
     * ```
     *
     * You can also return the issue data from a function in case you need dynamic values based on
     * data computed during the test run.
     *
     * ```ts
     * const executionIssueData = {
     *   fields: {
     *     issuetype: {
     *       name: "Test Execution",
     *     },
     *     summary: "My default summary",
     *     description: "My default description",
     *   },
     * };
     * await configureXrayPlugin(on, config, {
     *   jira: {
     *     projectKey: "CYP",
     *     testExecutionIssue: ({ results }) => {
     *       if (results.totalFailed > 0) {
     *         executionIssueData.fields.summary = "Failed test execution";
     *       }
     *       return executionIssueData;
     *     },
     *     url: "https://example.org",
     *   },
     * });
     * ```
     *
     * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post
     * @see https://developer.atlassian.com/server/jira/platform/rest/v10000/api-group-issue/#api-api-2-issue-post
     */
    testExecutionIssue?:
        | ((args: {
              /**
               * The Cypress run results.
               */
              results: CypressCommandLine.CypressRunResult;
          }) => PluginIssueUpdate | Promise<PluginIssueUpdate>)
        | PluginIssueUpdate;
    /**
     * The description of the test execution issue, which will be used both for new test execution
     * issues as well as for updating existing issues (if provided through
     * {@link JiraOptions.testExecutionIssue}).
     *
     * If omitted, test execution issues will have the following description:
     * ```ts
     * `Cypress version: ${cypressVersion} Browser: ${browserName} (${browserVersion})`
     * ```
     *
     * @deprecated Will be removed in version `8.0.0`. Please use the following instead:
     *
     * @example
     *
     * ```ts
     * configureXrayPlugin(on, config, {
     *   // ...
     *   testExecutionIssue: {
     *     fields: {
     *       description: "my description"
     *     }
     *   }
     * });
     * ```
     */
    testExecutionIssueDescription?: string;
    /**
     * An execution issue key to attach run results to. If omitted, Jira will always create a new
     * test execution issue with each upload.
     *
     * @example "CYP-123"
     *
     * @deprecated Will be removed in version `8.0.0`. Please use the following instead:
     *
     * @example
     *
     * ```ts
     * configureXrayPlugin(on, config, {
     *   // ...
     *   testExecutionIssue: {
     *     key: "CYP-123"
     *   }
     * });
     * ```
     */
    testExecutionIssueKey?: string;
    /**
     * The summary of the test execution issue, which will be used both for new test execution
     * issues as well as for updating existing issues (if provided through
     * {@link JiraOptions.testExecutionIssue}).
     *
     * If omitted, test execution issues will be named as follows:
     * ```ts
     * `Execution Results [${t}]`,
     * ```
     * where `t` is the timestamp when Cypress started testing.
     *
     * @deprecated Will be removed in version `8.0.0`. Please use the following instead:
     *
     * @example
     *
     * ```ts
     * configureXrayPlugin(on, config, {
     *   // ...
     *   testExecutionIssue: {
     *     fields {
     *       summary: "my summary"
     *     }
     *   }
     * });
     * ```
     */
    testExecutionIssueSummary?: string;
    /**
     * The issue type name of test executions. By default, Xray calls them `Test Execution`, but
     * it's possible that they have been renamed or translated in your Jira instance.
     *
     * @deprecated Will be removed in version `8.0.0`. Please use the following instead:
     *
     * @example
     *
     * ```ts
     * configureXrayPlugin(on, config, {
     *   // ...
     *   testExecutionIssue: {
     *     fields: {
     *       issuetype: {
     *         id: "12345",
     *         name: "Test Execution"
     *         // whatever is necessary to uniquely identify the issue type
     *       }
     *     }
     *   }
     * });
     * ```
     */
    testExecutionIssueType?: string;
    /**
     * A test plan issue key to attach the execution to.
     *
     * @example "CYP-567"
     */
    testPlanIssueKey?:
        | ((args: {
              /**
               * The Cypress run results.
               */
              results: CypressCommandLine.CypressRunResult;
          }) => Promise<string> | string)
        | string;
    /**
     * The issue type name of test plans. By default, Xray calls them `Test Plan`, but it's possible
     * that they have been renamed or translated in your Jira instance.
     *
     * @deprecated Unused, will be removed in version `8.0.0`.
     */
    testPlanIssueType?: string;
    /**
     * Use this parameter to specify the base URL of your Jira instance.
     *
     * @example "https://example.org/development/jira" // Jira server
     * @example "https://your-domain.atlassian.net" // Jira cloud
     */
    url: string;
}

/**
 * A more specific Jira options type with optional properties converted to required ones if
 * default/fallback values are used by the plugin.
 */
export type InternalJiraOptions = JiraOptions &
    Required<
        Pick<
            JiraOptions,
            | "attachVideos"
            | "fields"
            | "projectKey"
            | "testExecutionIssueType"
            | "testPlanIssueType"
            | "url"
        >
    >;

/**
 * Xray settings that may be required depending on the project configuration.
 */
export interface XrayOptions {
    /**
     * A mapping of Cypress statuses to corresponding Xray _test_ statuses.
     */
    status?: {
        /**
         * The Xray status name of a test marked as failed by Cypress. Should be used when custom
         * status names have been set up in Xray.
         *
         * @example "FEHLGESCHLAGEN" // german
         */
        failed?: string;
        /**
         * The Xray status name of a test marked as passed by Cypress. Should be used when custom
         * status names have been set up in Xray.
         *
         * @example "BESTANDEN" // german
         */
        passed?: string;
        /**
         * The Xray status name of a test marked as pending by Cypress. Should be used when custom
         * status names have been set up in Xray.
         *
         * @example "EN_ATTENTE" // french
         */
        pending?: string;
        /**
         * A function that returns a single status for a given combination of other statuses. It is
         * used to determine the final status of retried and data-driven tests.
         *
         * By default, the reduction works as follows in order of mention:
         *
         * - a test is considered _passed_ if:
         *   - all iterations pass
         *   - at least one iteration passes and all others are pending
         * - a test is considered _pending_ if:
         *   - all iterations are pending
         * - a test is considered _skipped_ if:
         *   - at least one iteration is skipped
         * - the test is considered _failed_ in all other scenarios
         *
         * @example
         *
         * The following example defines a custom _FLAKY_ status:
         *
         * ```ts
         * ({ failed, passed, pending, skipped }) => {
         *   if (passed > 0 && failed === 0 && skipped === 0) {
         *     return "PASSED";
         *   }
         *   if (passed > 0 && (failed > 0 || skipped > 0)) {
         *     return "FLAKY";
         *   }
         *   if (pending > 0) {
         *     return "TODO";
         *   }
         *   return "FAILED";
         * }
         * ```
         *
         * @param args - the reduction arguments
         * @returns the reduced status
         */
        reduce?: (args: {
            /**
             * The number of iterations that have been reported as _failed_ by Cypress.
             *
             * @see https://docs.cypress.io/app/core-concepts/writing-and-organizing-tests#Failed
             */
            failed: number;
            /**
             * The number of iterations that have been reported as _passed_ by Cypress.
             *
             * @see https://docs.cypress.io/app/core-concepts/writing-and-organizing-tests#Passed
             */
            passed: number;
            /**
             * The number of iterations that have been reported as _pending_ by Cypress.
             *
             * @see https://docs.cypress.io/app/core-concepts/writing-and-organizing-tests#Pending
             */
            pending: number;
            /**
             * The number of iterations that have been reported as _skipped_ by Cypress.
             *
             * @see https://docs.cypress.io/app/core-concepts/writing-and-organizing-tests#Skipped
             */
            skipped: number;
        }) => string;
        /**
         * The Xray status name of a test marked as skipped by Cypress. Should be used when custom
         * status names have been set up in Xray.
         *
         * @example "OMIT" // french
         */
        skipped?: string;
        /**
         * A mapping of Cypress statuses to corresponding Xray _step_ statuses. These are currently
         * only accessed in Cucumber report conversion.
         */
        step?: {
            /**
             * The Xray status name of a step marked as failed. Should be used when custom status
             * names have been set up in Xray.
             *
             * @example "FEHLGESCHLAGEN" // german
             */
            failed?: string;
            /**
             * The Xray status name of a step marked as passed. Should be used when custom status
             * names have been set up in Xray.
             *
             * @example "BESTANDEN" // german
             */
            passed?: string;
            /**
             * The Xray status name of a step marked as pending. Should be used when custom status
             * names have been set up in Xray.
             *
             * @example "EN_ATTENTE" // french
             */
            pending?: string;
            /**
             * The Xray status name of a step marked as skipped. Should be used when custom status
             * names have been set up in Xray.
             *
             * @example "OMIT" // french
             */
            skipped?: string;
        };
    };
    /**
     * The test environments for test execution issues. These will be used as follows:
     * - if the plugin creates new test execution issues, they will be associated with the issue
     * - if the plugin reuses existing test execution issues, they will:
     *   - replace existing test environments
     *   - be added if the issue does not yet have any test environments associated
     *
     * *Note: Xray's API only allows _replacing_ test environments in the plugin's scope. It is not
     * possible to completely _remove_ all existing test environments during result upload.
     * Completely removing all existing environments needs to be done manually.*
     *
     * @see {@link https://docs.getxray.app/display/XRAY/Working+with+Test+Environments | Xray server documentation}
     * @see {@link https://docs.getxray.app/display/XRAYCLOUD/Working+with+Test+Environments | Xray cloud documentation}
     */
    testEnvironments?: [string, ...string[]];
    /**
     * Enables or disables the upload of manually executed requests using `cy.request`. If `true`,
     * requests and responses will be attached to the corresponding test as evidence. If `false` or
     * left `undefined`, neither requests nor responses are attached.
     *
     * *Note: For this option to work properly, you need to overwrite the `cy.request` command.*
     *
     * @see https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/uploadRequestData/
     */
    uploadRequests?: boolean;
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

/**
 * A more specific Xray options type with optional properties converted to required ones if
 * default/fallback values are used by the plugin.
 */
export type InternalXrayOptions = XrayOptions &
    Required<
        Pick<XrayOptions, "status" | "uploadRequests" | "uploadResults" | "uploadScreenshots">
    >;

/**
 * When Cucumber is enabled, these options are used to configure how the plugin works with
 * encountered feature files.
 */
export interface CucumberOptions {
    /**
     * Set it to true to automatically download feature files from Xray for Cypress to execute.
     *
     * *Note: Enable this option if the source of truth for test cases are step definitions in Xray
     * and Cypress is only used for running tests.*
     */
    downloadFeatures?: boolean;
    /**
     * The file extension of feature files you want to run in Cypress. The plugin will use this to
     * parse all matching files with to extract any tags contained within them. Such tags are
     * needed to identify to which test issue a feature file belongs.
     *
     * @example ".cy.feature"
     */
    featureFileExtension: string;
    /**
     * These settings allow specifying tag prefixes used by Xray when exporting or importing feature
     * files and Cucumber test results. The plugin will access these options to verify that your
     * feature files are tagged correctly according to your Xray prefix scheme.
     *
     * @remarks
     *
     * Whenever Cucumber test results or entire feature files are imported, Xray tries to link
     * existing test and precondition Jira issues with the executed/present Cucumber scenarios and
     * backgrounds. The default matching is quite involved (see documentation for
     * {@link https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST | Xray server}
     * or {@link https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST | Xray cloud}),
     * but luckily Xray also supports and uses
     * {@link https://cucumber.io/docs/cucumber/api/?lang=java#tags | feature file tags}.
     *
     * The tags are of the form `@CYP-123` or `@Prefix:CYP-123`, containing an optional prefix and
     * the issue key. The concrete prefix and whether a prefix is at all necessary depends on your
     * configured prefix scheme in Xray.
     *
     * If any tag in a feature file (and thus the Cucumber JSON report used for importing test
     * execution results) is not consistent with the scheme defined in Xray, Xray will reject the
     * imported results altogether.
     *
     * More information:
     * - {@link https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes | Plugin documentation for `prefixes`}
     * - Xray feature tagging
     *   - {@link https://docs.getxray.app/display/XRAY/Export+Cucumber+Features | Xray server}
     *   - {@link https://docs.getxray.app/display/XRAYCLOUD/Generate+Cucumber+Features | Xray cloud}
     * - Xray import behaviour
     *   - {@link https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST | Xray server}
     *   - {@link https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST | Xray cloud}
     * - Xray Cucumber prefix schemes
     *   - {@link https://docs.getxray.app/display/XRAY/Miscellaneous#Miscellaneous-CucumberExportPrefixes | Xray server}
     *   - {@link https://docs.getxray.app/display/XRAYCLOUD/Global+Settings%3A+Cucumber | Xray cloud}
     */
    prefixes?: {
        /**
         * The prefix for Cucumber background tags.
         *
         * If left undefined, the plugin will assume that your Xray instance is able to properly
         * parse issue tags _without_ any prefixes, e.g. background tags of the form `@CYP-123`
         * instead of something like `@Precondition:CYP-123`.
         *
         * @example 'Precondition:'
         * @example 'PRECOND_'
         */
        precondition?: string;
        /**
         * The prefix for Cucumber scenario tags.
         *
         * If left undefined, the plugin will assume that your Xray instance is able to properly
         * parse issue tags _without_ any prefixes, e.g. scenario tags of the form `@CYP-123`
         * instead of something like `@TestName:CYP-123`.
         *
         * @example 'TestName:'
         * @example 'TEST_'
         */
        test?: string;
    };
    /**
     * Set it to true to automatically create or update existing Xray issues (summary, steps),
     * based on the feature file executed by Cypress.
     *
     * *Note: Enable this option if the source of truth for test cases are local feature files in
     * Cypress and Xray is only used for tracking execution status/history.*
     */
    uploadFeatures?: boolean;
}

/**
 * A more specific Cucumber options type with optional properties converted to required ones if
 * default/fallback values are used by the plugin.
 */
export interface InternalCucumberOptions extends Required<CucumberOptions> {
    /**
     * The Cucumber preprocessor configuration.
     */
    preprocessor?: Pick<IPreprocessorConfiguration, "json">;
}

/**
 * Options which the plugin will use when making HTTP requests. You can specify
 * [common options](https://axios-http.com/docs/req_config) to use for all requests or choose to
 * define specific ones for Jira or Xray.
 */
export type HttpOptions = AxiosRequestConfig &
    Pick<RequestsOptions, "rateLimiting"> & {
        /**
         * The HTTP configuration for requests to Jira. HTTP options defined for both clients will be
         * overridden in the Jira client by those defined here.
         *
         * *Note: In a Jira/Xray server environment, the Jira and Xray endpoints will reside on the same
         * host. To avoid duplicating your HTTP configuration, it is recommended that you define a
         * single one instead, e.g.:*
         *
         * ```ts
         * {
         *   // ...other plugin options
         *   http: {
         *     proxy: {
         *       host: "http://1.2.3.4",
         *       port: 12345
         *     }
         *   }
         * }
         * ```
         */
        jira?: AxiosRequestConfig & Pick<RequestsOptions, "rateLimiting">;
        /**
         * The HTTP configuration for requests to Xray. HTTP options defined for both clients will be
         * overridden in the Jira client by those defined here.
         *
         * *Note: In a Jira/Xray server environment, the Jira and Xray endpoints will reside on the same
         * host. To avoid duplicating your HTTP configuration, it is recommended that you define a
         * single one instead, e.g.:*
         *
         * ```ts
         * {
         *   // ...other plugin options
         *   http: {
         *     proxy: {
         *       host: "http://1.2.3.4",
         *       port: 12345
         *     }
         *   }
         * }
         * ```
         */
        xray?: AxiosRequestConfig & Pick<RequestsOptions, "rateLimiting">;
    };

export type InternalHttpOptions = HttpOptions;

/**
 * Options for configuring the general behaviour of the plugin.
 */
export interface PluginOptions {
    /**
     * Enables or disables extensive debugging output.
     */
    debug?: boolean;
    /**
     * Enables or disables the entire plugin. Setting this option to false will disable all plugin
     * functions, including authentication checks, uploads or feature file synchronization.
     */
    enabled?: boolean;
    /**
     * The directory which all error and debug log files will be written to.
     */
    logDirectory?: string;
    /**
     * Some Xray setups may have problems with uploaded evidence if the filenames contain non-ASCII
     * characters. With this option enabled, the plugin will only allow the characters `a-zA-Z0-9.`
     * in screenshot names, and will replace all other sequences with `_`.
     */
    normalizeScreenshotNames?: boolean;
}

/**
 * A more specific Cucumber options type with optional properties converted to required ones if
 * default/fallback values are used by the plugin.
 */
export type InternalPluginOptions = PluginOptions &
    Required<
        Pick<PluginOptions, "debug" | "enabled" | "logDirectory" | "normalizeScreenshotNames">
    >;

/**
 * Options only intended for internal plugin use.
 */
export interface InternalCypressXrayPluginOptions {
    cucumber?: InternalCucumberOptions;
    http?: InternalHttpOptions;
    jira: InternalJiraOptions;
    plugin: InternalPluginOptions;
    xray: InternalXrayOptions;
}

/**
 * Type describing the possible client combinations.
 */
export interface ClientCombination {
    jiraClient: JiraClient;
    kind: "cloud" | "server";
    xrayClient: XrayClient;
}

/**
 * Wraps the REST clients used for HTTP requests directed at Jira and Xray.
 */
export interface HttpClientCombination {
    jira: AxiosRestClient;
    xray: AxiosRestClient;
}
