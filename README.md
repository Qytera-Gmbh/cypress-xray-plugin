<h1 align="center">
	<img width="100%" src="logo.svg" alt="Cypress Xray Plugin">
	<br>
	<div align="left">
		<a href="https://www.npmjs.com/package/cypress-xray-plugin">
	    	<img src=https://img.shields.io/npm/v/cypress-xray-plugin?style=flat-square alt="npm version">
	    	<img src=https://img.shields.io/npm/dm/cypress-xray-plugin?style=flat-square alt="npm downloads">
		</a>
		<a href="https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues?q=is%3Aissue+is%3Aopen">
			<img src="https://img.shields.io/github/issues-raw/qytera-gmbh/cypress-xray-plugin?style=flat-square" alt="open GitHub issues">
		</a>
		<a href="https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues?q=is%3Aissue+is%3Aopen+no%3Aassignee">
			<img src="https://img.shields.io/github/issues-search/qytera-gmbh/cypress-xray-plugin?label=unaddressed%20issues&query=no%3Aassignee%20is%3Aopen&style=flat-square" alt="unadressed GitHub issues">
		</a>
	</div>
</h1>

# Cypress Xray Plugin

> A plugin for coupling together Cypress and Xray.

Features include:

  - upload test results to Xray
    - attach screenshots as test execution evidence
    - attach videos to test execution issues
    - reuse existing test execution and test plan issues
  - CI/CD ready
    - no hardcoded credentials
	- every option customizable in CLI
  - Cucumber integration (experimental)
    - synchronization/upload of step definitions with Xray
	- results upload as described above

## Quick Setup

Run the following command to add the plugin to your project:

```sh
npm i -D cypress-xray-plugin
```

> **Note**
> This plugin only works when running Cypress through the CLI (i.e. `npx cypress run`).

## Documentation

Please [visit the documentation](https://qytera-gmbh.github.io/projects/cypress-xray-plugin) to find out how to fully setup the plugin, including a full list of options.

## Issues

If you're encountering strange behaviour or feel like a feature is missing, feel free to create a [GitHub issue](https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues).