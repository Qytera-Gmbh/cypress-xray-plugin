# Changelog

# `4.0.0`

This version heavily focused on features surrounding the upload of Cucumber results.
Unfortunately, the Cucumber results upload deviates from the upload of "normal" Cypress results in terms of behaviour regarding nonexistent issues, issue reuse or Jira configuration in general.
The reason for this are simply limitations in Xray's APIs.

Some of the plugin's core functionality has been rewritten entirely to keep things consistent for both upload behaviours. Because of this, some options had to be removed since they are either not needed anymore or are now built into the plugin's internal workflows.

## Breaking changes

- The plugin will now _never_ create new Jira issues. The only exception to this rule are test execution issues.

  - It now only uploads results of Cypress tests which include [a corresponding Jira key](https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/) and skips all other tests

  - It now only uploads results of Cucumber tests which include both:

    - Issue tags for background elements (see [here](https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/))

    - Issue tags for _all_ scenarios and scenario backgrounds (see [here](https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/))

  - It now also skips feature file upload/synchronization of feature files for which the above does not apply

  > **Note**
  > If the plugin still creates test or precondition issues somehow, [please file a bug](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues), since it's simply not supposed to anymore.

<br>

- Jira client instantiation is now _mandatory_, meaning both Xray _and_ Jira credentials must *always* be provided

- Option `jira.url` is now mandatory

- The plugin's functions must now be imported without adding `/plugin` at the end:

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
    syncFeatureFile
  } from "cypress-xray-plugin/plugin";
  ```
  </td>
  <td>

  ```ts
  import {
    addXrayResultUpload,
    configureXrayPlugin,
    syncFeatureFile
  } from  "cypress-xray-plugin";
  ```
  </td>
  </tr>
  </tbody>
  </table>

- The configuration function now expects the Cypress configuration as first parameter:
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

- When Cucumber is used, enabling the [JSON report](https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/docs/json-report.md) of the `cypress-cucumber-preprocessor` plugin is now mandatory, for example:
  ```json
  // .cypress-cucumber-preprocessorrc.json
  {
    "json": {
      "enabled": true,
      "output": "cypress/cucumber-json/formatted-report.json"
    }
  }
  ```

- Removed `plugin.overwriteIssueSummary` option

- Removed `xray.testType` option

- Removed `jira.createTestIssues` option


## Notable changes

- Restricted exported plugin members to those defined in `index.ts`

- Added `plugin.logDirectory` option

- Added `jira.testExecutionIssueType` option

- Added `jira.testPlanIssueType` option

- Feature file upload/synchronization now automatically resets the summary should the import change it

- Logging output has been beautified

# `3.3.3` and before
For versions `3.3.3` and before, please check the [GitHub releases page](https://github.com/Qytera-Gmbh/cypress-xray-plugin/releases).