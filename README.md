# Cypress Xray Plugin

A plugin for uploading Cypress test results to Jira Xray.

> **Note**
> This plugin only works when running Cypress through the CLI (i.e. `npx cypress run`).

## Requirements

- [Node.JS version 18.12.1](https://nodejs.org/en/download/) or better

Type `node --version` in a terminal to check your version.

# Setup

To enable this Cypress plugin, add the following lines to your Cypress configuration file (`cypress.config.js` or `cypress.config.js` by default):

```js
[...]
setupNodeEvents(on, config) {
    require("cypress-xray-plugin/plugin")(on);
    [...]
}
```

and register the plugin's event listeners in the `e2e.js` file:

```js
// Import commands.js using ES2015 syntax:
[...]
import "cypress-xray-plugin/register";
[...]

```

## Usage

To use this plugin, you need to add Xray authentication to your environment variables, i.e.:

To avoid adding your secrets to system environment variables, simply pass them to Cypress in the command line:

```sh
npx cypress run --env XRAY_CLIENT_ID="my-id-goes-here",XRAY_SECRET_ID="my-secret-goes-here"
```
