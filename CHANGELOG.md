# Changelog

# `7.0.1`

## Notable changes

-   Made plugin take Cypress project root into account ([#338](https://github.com/Qytera-Gmbh/cypress-xray-plugin/pull/338), fixes [#337](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/337))

-   Changed plugin to only run in CLI mode ([#334](https://github.com/Qytera-Gmbh/cypress-xray-plugin/pull/334))

## Dependency updates

-   Bump axios from 1.6.8 to 1.7.2

-   Bump semver from 7.6.0 to 7.6.2

# `7.0.0`

## Breaking changes

-   Removed `addResultsUpload` function

-   Changed `configureXrayPlugin` function which now expects Cypress' `on` as first parameter:

    <table>
    <thead>
    <tr>
    <th>
    <pre>6.0.0</pre>
    </th>
    <th>
    <pre>7.0.0</pre>
    </th>
    </tr>
    </thead>
    <tbody>
    <tr>
    <td>

    ```ts
    // cypress.config.js
    import { configureXrayPlugin, addXrayResultUpload } from "cypress-xray-plugin";

    async setupNodeEvents(on, config) {
      await configureXrayPlugin(
        config,
        {
          jira: {
            url: "https://example.org",
            projectKey: "ABC"
          }
        }
      );
      await addXrayResultUpload(on);
    }
    ```

    </td>
    <td>

    ```ts
    // cypress.config.js
    import { configureXrayPlugin } from "cypress-xray-plugin";

    async setupNodeEvents(on, config) {
      await configureXrayPlugin(
        on,
        config,
        {
          jira: {
            url: "https://example.org",
            projectKey: "ABC"
          }
        }
      );
    }
    ```

    </td>
    </tr>
    </tbody>
    </table>

-   Removed `openSSL` options:

    <table>
    <thead>
    <tr>
    <th>
    <pre>6.0.0</pre>
    </th>
    <th>
    <pre>7.0.0</pre>
    </th>
    </tr>
    </thead>
    <tbody>
    <tr>
    <td>

    ```ts
    // cypress.config.js
    import { configureXrayPlugin } from "cypress-xray-plugin";
    import { constants } from "node:crypto";

    async setupNodeEvents(on, config) {
      await configureXrayPlugin(
        config,
        {
          openSSL: {
            rootCAPath: "/home/somewhere/cert.pem",
            secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT
          }
        }
      );
    }
    ```

    </td>
    <td>

    ```ts
    // cypress.config.js
    import { configureXrayPlugin } from "cypress-xray-plugin";
    import { constants } from "node:crypto";
    import { Agent } from "node:https";

    async setupNodeEvents(on, config) {
      await configureXrayPlugin(
        on,
        config,
        {
          http: {
            httpAgent: new Agent({
              ca: "/home/somewhere/cert.pem",
              secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT,
            }),
          }
        }
      );
    }
    ```

    </td>
    </tr>
    </tbody>
    </table>

-   Changed support file import:

    <table>
    <thead>
    <tr>
    <th>
    <pre>6.0.0</pre>
    </th>
    <th>
    <pre>7.0.0</pre>
    </th>
    </tr>
    </thead>
    <tbody>
    <tr>
    <td>

    ```ts
    // cypress/support/e2e.js
    import "cypress-xray-plugin/register";
    ```

    </td>
    <td>

    ```ts
    // cypress/support/e2e.js
    import "cypress-xray-plugin/commands";
    ```

    </td>
    </tr>
    </tbody>
    </table>

> [!NOTE]
> Up to version 7, this import did nothing, the imported module was completely empty.
> From version 7, this import allows `cy.request` data to be uploaded as Xray execution evidence.
> It can simply be omitted if no request data needs to be uploaded.

## Notable changes

-   Added `xray.uploadRequests` option ([#324](https://github.com/Qytera-Gmbh/cypress-xray-plugin/pull/324))

-   Added `http` options ([#322](https://github.com/Qytera-Gmbh/cypress-xray-plugin/pull/322))

## Dependency updates

-   Bump @cucumber/gherkin from 27.0.0 to 28.0.0

-   Bump @cucumber/messages from 24.0.0 to 24.1.0

-   Bump axios from 1.6.2 to 1.6.8

-   Bump semver from 7.5.4 to 7.6.0

-   Bump @badeball/cypress-cucumber-preprocessor from 19.2.0 to 20.0.3

# `6.0.0`

> [!NOTE]
> The breaking changes apply to projects with Cucumber integration only.

Up until version `6.0.0`, the plugin assumed in feature file imports and Cucumber execution results upload that:

-   Xray cloud:
    -   always uses `Precondition:` prefixes for background-precondition linking
    -   always uses `TestName:` prefixes for scenario-test linking
-   Xray server:
    -   always tags without prefixes for background-precondition linking
    -   always tags without prefixes for scenario-test linking

This was found to be not the case in [#275](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/275), both Xray cloud and Xray server have the option to customize all these prefixes.

## Breaking changes

-   Cucumber tag prefixes should now be manually configured, as demonstrated for the following feature file:

    ```gherkin
    Feature: A cool story

      Background:
          #@MyPreconditionPrefix:CYP-222
          Given A
          When B
          Then C

      @MyTestPrefix:CYP-333
      Scenario: A cool scenario
          Given X
          When Y
          Then Z
    ```

    <table>
    <thead>
    <tr>
    <th>
    <pre>5.2.2</pre>
    </th>
    <th>
    <pre>6.0.0</pre>
    </th>
    </tr>
    </thead>
    <tbody>
    <tr>
    <td>

    ```ts
    async setupNodeEvents(on, config) {
      await configureXrayPlugin(
        config,
        {
          cucumber: {
            // No extra configuration necessary, the plugin
            // automatically assumed tag prefixes
          }
        }
      );
    }
    ```

    </td>
    <td>

    ```ts
    async setupNodeEvents(on, config) {
      await configureXrayPlugin(
        config,
        {
          cucumber: {
            prefixes: {
              precondition: "MyPreconditionPrefix:",
              test: "MyTestPrefix:"
            }
          }
        }
      );
    }
    ```

    </td>
    </tr>
    </tbody>
    </table>

## Notable changes

-   Added `cucumber.prefixes` options

-   Removed `decompress` dependency

# `5.2.2`

## Notable changes

-   Hid initialization error messages if the plugin is disabled (fixes [#271](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/271))

-   Added first step to Cucumber error messages ([#257](https://github.com/Qytera-Gmbh/cypress-xray-plugin/pull/257))

## Dependency updates

-   Bump @cucumber/messages from 23.0.0 to 24.0.0

-   Bump @badeball/cypress-cucumber-preprocessor from 19.0.1 to 19.2.0

-   Bump axios from 1.6.0 to 1.6.2

# `5.2.1`

## Dependency updates

-   Bump @badeball/cypress-cucumber-preprocessor from 18.0.6 to 19.0.1

-   Bump @cucumber/messages from 22.0.0 to 23.0.0

-   Bump axios from 1.5.1 to 1.6.0

# `5.2.0`

## Notable changes

-   Added test environment support (fixes [#223](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/223))

# `5.1.1`

## Notable changes

-   Added Jira and Xray pings during plugin initialization for configuration verification ([#199](https://github.com/Qytera-Gmbh/cypress-xray-plugin/pull/199))

-   Prevent results upload from modifying test issues unnecessarily (fixes [#209](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/209), [#210](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/210))

-   Prevent Cucumber results upload of untagged scenarios ([#214](https://github.com/Qytera-Gmbh/cypress-xray-plugin/pull/214))

## Dependency updates

-   Bump axios from 1.5.0 to 1.5.1

# `5.1.0`

## Notable changes

-   Move `cypress` to the plugin's peer dependencies to impose supported Cypress version ranges

-   Prevent existing test execution issue data (summaries, descriptions) from being overwritten unnecessarily (fixes [#191](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/191))

## Dependency updates

-   Bump @badeball/cypress-cucumber-preprocessor from 18.0.5 to 18.0.6

-   Bump @cucumber/gherkin from 26.2.0 to 27.0.0

# `5.0.0`

[Cypress version 13](https://docs.cypress.io/guides/references/changelog#13-0-0) was recently released and changed the module API, which this plugin heavily relies on to upload test results to Xray. A few core feature of the plugin had to be rewritten to adapt to these changes.

> [!NOTE]
> Previous versions of Cypress will still work just fine, the plugin is backwards compatible regarding Cypress versions.

The changes included a removal of the test function code, which previously was used to update the test steps in Xray. Because the step updates were furthermore quite problematic/lackluster anyways ([#50](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/50), [#164](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/164), [#169](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/169)), step updates have been removed from the plugin entirely.

> [!NOTE]
> Cucumber feature file synchronization was not affected by this change, which means that upload of feature files can still change Cucumber steps in Xray.

## Breaking changes

-   The plugin will now _never_ alter existing Xray test steps of tests with test type _Manual_

    -   Removed `xray.steps.update` option

    -   Removed `xray.steps.maxLengthAction` option

-   The `xray.status` options have been refactored a little bit for maintainability reasons:

    <table>
    <thead>
    <tr>
    <th>
    <pre>4.0.4</pre>
    </th>
    <th>
    <pre>5.0.0</pre>
    </th>
    </tr>
    </thead>
    <tbody>
    <tr>
    <td>

    ```ts
    xray: {
      statusPassed: "OK",
      statusFailed: "NO",
      statusPending: "TBD",
      statusSkipped: "OMIT",
    }
    ```

    </td>
    <td>

    ```ts
    xray: {
      status: {
        passed: "OK",
        failed: "NO",
        pending: "TBD",
        skipped: "OMIT",
      }
    }
    ```

    </td>
    </tr>
    </tbody>
    </table>

> [!NOTE]
> Their environment variables have _not_ changed.

-   With Node V16 being past its [end of life date](https://nodejs.dev/en/about/releases/), the plugin now requires Node V18 (LTS) to be installed

## Dependency updates

-   Bump @badeball/cypress-cucumber-preprocessor from 18.0.4 to 18.0.5

# `4.0.4`

## Notable changes

-   Prevent manual test steps from being overwritten although `xray.steps.update` is `false` (fixes [#164](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/164))

## Dependency updates

-   Bump axios from 1.4.0 to 1.5.0

# `4.0.3`

## Notable changes

-   Prevent missing scenario tags from throwing errors (fixes [#100](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/100#issuecomment-1691347675))

# `4.0.2`

## Notable changes

-   Reset issue labels after feature file import (fixes [#100](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/100))

-   Use dynamic `@badeball/cypress-cucumber-preprocessor` import (fixes [#152](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/152))

## Dependency updates

-   Bump @badeball/cypress-cucumber-preprocessor from 18.0.2 to 18.0.4

# `4.0.1`

## Notable changes

-   Fix `cypress-xray-plugin/register` export (fixes [#133](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues/133))

## Dependency updates

-   Bump @badeball/cypress-cucumber-preprocessor from 18.0.1 to 18.0.2

-   Bump dedent from 1.2.0 to 1.5.0

# `4.0.0`

This version heavily focused on features surrounding the upload of Cucumber results.
Unfortunately, the Cucumber results upload deviates from the upload of "normal" Cypress results in terms of behaviour regarding nonexistent issues, issue reuse or Jira configuration in general.
The reason for this are simply limitations in Xray's APIs.

Some of the plugin's core functionality has been rewritten entirely to keep things consistent for both upload behaviours. Because of this, some options had to be removed since they are either not needed anymore or are now built into the plugin's internal workflows.

## Breaking changes

-   The plugin will now _never_ create new Jira issues. The only exception to this rule are test execution issues.

    -   It now only uploads results of Cypress tests which include [a corresponding Jira key](https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/) and skips all other tests

    -   It now only uploads results of Cucumber tests which include both:

        -   Issue tags for background elements (see [here](https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/))

        -   Issue tags for _all_ scenarios and scenario backgrounds (see [here](https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/))

    -   It now also skips feature file upload/synchronization of feature files for which the above does not apply

> [!NOTE]
> If the plugin still creates test or precondition issues somehow, [please file a bug](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues), since it's simply not supposed to anymore.

-   Jira client instantiation is now _mandatory_, meaning both Xray _and_ Jira credentials must _always_ be provided

-   Option `jira.url` is now mandatory

-   The plugin's functions must now be imported without adding `/plugin` at the end:

    <table>
    <thead>
    <tr>
    <th>
    <pre>3.3.3</pre>
    </th>
    <th>
    <pre>4.0.0</pre>
    </th>
    </tr>
    </thead>
    <tbody>
    <tr>
    <td>

    ```ts
    import {
        addXrayResultUpload,
        configureXrayPlugin,
        syncFeatureFile,
    } from "cypress-xray-plugin/plugin";
    ```

    </td>
    <td>

    ```ts
    import { addXrayResultUpload, configureXrayPlugin, syncFeatureFile } from "cypress-xray-plugin";
    ```

    </td>
    </tr>
    </tbody>
    </table>

-   The configuration function now expects the Cypress configuration as first parameter:

    ```ts
    async setupNodeEvents(on, config) {
      await configureXrayPlugin(
        config, // here
        {
          jira: {
            projectKey: "CYP",
            url: "https://example.atlassian.net"
          }
        }
      );
      // ...
    }
    ```

-   When Cucumber is used, enabling the [JSON report](https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md) of the `cypress-cucumber-preprocessor` plugin is now mandatory, for example:

    ```json
    // .cypress-cucumber-preprocessorrc.json
    {
        "json": {
            "enabled": true,
            "output": "cypress/cucumber-json/formatted-report.json"
        }
    }
    ```

-   Removed `plugin.overwriteIssueSummary` option

-   Removed `xray.testType` option

-   Removed `jira.createTestIssues` option

## Notable changes

-   Restricted exported plugin members to those defined in `index.ts`

-   Added `plugin.logDirectory` option

-   Added `jira.testExecutionIssueType` option

-   Added `jira.testPlanIssueType` option

-   Feature file upload/synchronization now automatically resets the summary should the import change it

-   Logging output has been beautified

## Dependency updates

-   Bump semver and @cucumber/cucumber

# `3.3.3` and before

For versions `3.3.3` and before, please check the [GitHub releases page](https://github.com/Qytera-Gmbh/cypress-xray-plugin/releases).
