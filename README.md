<h1 align="center">
  <a href="https://qytera-gmbh.github.io/projects/cypress-xray-plugin">
  <img width="100%" src="logo.svg" alt="Cypress Xray Plugin">
</h1>

[![npm version](https://img.shields.io/npm/v/cypress-xray-plugin?style=flat-square)](https://www.npmjs.com/package/cypress-xray-plugin)
[![npm downloads](https://img.shields.io/npm/dm/cypress-xray-plugin?style=flat-square)](https://www.npmjs.com/package/cypress-xray-plugin)
[![open GitHub issues](https://img.shields.io/github/issues-raw/qytera-gmbh/cypress-xray-plugin?style=flat-square)](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues?q=is%3Aissue+is%3Aopen)
[![unaddressed GitHub issues](https://img.shields.io/github/issues-search/qytera-gmbh/cypress-xray-plugin?label=unaddressed%20issues&query=no%3Aassignee%20is%3Aopen&style=flat-square)](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues?q=is%3Aissue+is%3Aopen+no%3Aassignee)

# Cypress Xray Plugin

> A Cypress plugin for Xray integration.
> Supports Xray Server/DC and Xray Cloud.

Features include:

- upload test results to Xray
    - attach screenshots as test execution evidence
    - attach web requests as test execution evidence
    - attach videos to test execution issues
    - reuse existing test execution and test plan issues
- CI/CD ready
    - no hardcoded credentials
    - every option customizable in CLI
- Cucumber integration
    - synchronization/upload of step definitions to Xray
    - results upload as described above

## Quick Setup

Run the following command to add the plugin to your project:

```sh
npm install --save-dev cypress-xray-plugin
```

Then, configure the plugin in the Cypress project configuration:

```js
import { configureXrayPlugin } from "cypress-xray-plugin";

export default defineConfig({
    e2e: {
        async setupNodeEvents(on, config) {
            await configureXrayPlugin(on, config, {
                jira: {
                    projectKey: "PRJ",
                    url: "https://example.org",
                },
            });
        },
    },
});
```

Make sure you also configure your [credentials](https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#authentication) for Jira/Xray.

To have the plugin upload test results, [link your test cases](https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/) to Xray tests by specifying the corresponding issue keys in the test titles:

```js
it("PRJ-42 My test", () => {
    // ...
});
```

> [!NOTE]
> This plugin only works when running Cypress through the CLI (i.e. `npx cypress run`).

## Documentation

Please [visit the documentation](https://qytera-gmbh.github.io/projects/cypress-xray-plugin) to find out how to fully setup the plugin, including a full list of options.

## Issues

If you're encountering strange behaviour or feel like a feature is missing, feel free to create a [GitHub issue](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues).
