# Cypress Xray Plugin

A plugin for coupling together Cypress and Xray.
Features include:

-   test results upload to Xray
    -   including screenshots
-   Cucumber integration
    -   synchronization/upload of step definitions with Xray
    -   upcoming: automatic download of step definitions from Xray + test execution

> **Note**
> This plugin only works when running Cypress through the CLI (i.e. `npx cypress run`).

## Table of contents

-   [Requirements](#requirements)
-   [Setup](#setup)
-   [Authentication](#authentication)
-   [Configuration](#configuration)
    -   [Jira Configuration](#jira-configuration)
    -   [Xray Configuration](#xray-configuration)
    -   [Cucumber Configuration](#cucumber-configuration)
    -   [Plugin Configuration](#plugin-configuration)
    -   [OpenSSL Configuration](#openssl-configuration)
    -   [Custom Option Types](#custom-option-types)

## Requirements

-   [Node.JS version 18.12.1](https://nodejs.org/en/download/) or better

Type `node --version` in a terminal to check your version.

## Setup

This plugin can either be run without Cucumber support (when you keep all your Cypress test cases in plain JavaScript/TypeScript files) or with Cucumber support (when using Cucumber feature files for running tests).

### Without Cucumber Support

Run the following command to add the plugin to your project:

```sh
npm i -D cypress-xray-plugin
```

To actually _enable_ the plugin, modify the `setupNodeEvents()` function in your Cypress configuration file (`cypress.config.js` or `cypress.config.ts` by default) as follows:

```js
import { addXrayResultUpload, configureXrayPlugin } from "cypress-xray-plugin/plugin";
// ...
async setupNodeEvents(on, config) {
    await configureXrayPlugin({
        jira: {
            projectKey: "PRJ"
        }
        // For more options, see below.
    });
    await addXrayResultUpload(on);
    // ...
}
```

and register the plugin's event listeners in the `e2e.js` file:

```js
// Import commands.js using ES2015 syntax:
// ...
import "cypress-xray-plugin/register";
// ...
```

### With Cucumber Support

This plugin also comes with Cucumber support and builds upon the [cypress-cucumber-preprocessor](https://github.com/badeball/cypress-cucumber-preprocessor) plugin for 'executing' Cucumber feature files.

With added Xray synchronization, this plugin allows you to automatically download or upload feature files to Xray when running your Cypress tests and to track their execution results in Xray.

Run the following commands to add this plugin and cucumber executability (more information [here](https://github.com/badeball/cypress-cucumber-preprocessor)) to your project:

```sh
npm i -D cypress-xray-plugin
npm i -D @badeball/cypress-cucumber-preprocessor
npm i -D @bahmutov/cypress-esbuild-preprocessor
```

> **Note**
> The following section is unfortunately quite involved. Cypress currently does not allow registering multiple plugins (https://github.com/cypress-io/cypress/issues/22428). Once this changes, this section will become much more streamlined, I promise 😥

To enable the plugin, modify the `setupNodeEvents()` function in your Cypress configuration file (`cypress.config.js` or `cypress.config.ts` by default) as follows:

```js
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import createEsbuildPlugin from "@badeball/cypress-cucumber-preprocessor/esbuild";
import * as createBundler from "@bahmutov/cypress-esbuild-preprocessor";
import { addXrayResultUpload, configureXrayPlugin, syncFeatureFile } from "cypress-xray-plugin/plugin";

// ...
async setupNodeEvents(on, config) {
    await configureXrayPlugin({
        jira: {
            projectKey: "PRJ"
        },
        cucumber: {
            featureFileExtension: ".feature"
        }
        // For more options, see below.
    });
    await addCucumberPreprocessorPlugin(on, config, {
        omitBeforeRunHandler: true,
        omitAfterRunHandler: true,
        omitBeforeSpecHandler: true,
        omitAfterSpecHandler: true,
        omitAfterScreenshotHandler: true,
    });
    await addXrayResultUpload(on);

    on("file:preprocessor", async (file) => {
        await syncFeatureFile(file);
        const cucumberPlugin = createBundler({
            plugins: [createEsbuildPlugin(config)],
        });
        return cucumberPlugin(file);
    });
    return config;
}
// ...
```

and register the plugin's event listeners in the `e2e.js` file:

```js
// Import commands.js using ES2015 syntax:
// ...
import "cypress-xray-plugin/register";
// ...
```

## Authentication

To use this plugin, you need to authenticate against your Xray instance.
You must do this by setting up specific environment variables, e.g. a client ID and a client secret when using a cloud based Jira instance.

To avoid adding your secrets to system environment variables, simply pass them to Cypress as a comma-separated list in the command line:

```sh
npx cypress run --env XRAY_CLIENT_ID="my-id-goes-here",XRAY_CLIENT_SECRET="my-secret-goes-here"
```

Below you will find all Xray authentication configurations that are currently supported and the environment variables you need to set to authenticate against their respective APIs.

| Xray API Type | API Version | Environment Variables                                                                           |
| ------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| Cloud         | `v1`, `v2`  | <ul><li>`XRAY_CLIENT_ID`</li><li>`XRAY_CLIENT_SECRET`</li></ul>                                 |
| Server (\*)   | `v1`, `v2`  | <ul><li>`XRAY_API_TOKEN`</li></ul><hr><ul><li>`XRAY_USERNAME`</li><li>`XRAY_PASSWORD`</li></ul> |

Depending on the provided environment variables, the plugin will automatically know which Xray API type to use.
For example, if you provide the `XRAY_API_TOKEN` variable and set the Jira server URL in the options (see [Jira Configuration](#jira-configuration)), the plugin will use the REST API of the [server version](https://docs.getxray.app/display/XRAY/REST+API).
If you provide the `XRAY_CLIENT_ID` and `XRAY_CLIENT_SECRET` variables, the plugin will use the REST API of the [cloud version](https://docs.getxray.app/display/XRAYCLOUD/REST+API).

Evaluation precedence of the environment variables goes from the table's top row to the table' bottom row, i.e. when providing more than one valid combination of variables, the cloud version will always be chosen in favor of the server version.

(\*) When targeting server instances, a Jira server URL must be provided in the [plugin options](#jira-configuration).

## Configuration

Apart from authentication, all configuration takes place using the `configureXrayPlugin` method in your cypress configuration file:

```js
// cypress.config.js (or .ts)
[...]
async setupNodeEvents(on, config) {
    await configureXrayPlugin({
        jira: {
            // ...
        },
        plugin: {
            // ...
        },
        xray: {
            // ...
        },
        cucumber: {
            // ...
        },
        openSSL: {
            // ...
        },
    });
    [...]
}
```

Every option can also be set via environment variables, but setting them up in this method is usually easier.

> **Note**
> If you specify options in this method **and** provide their respective environment variables, the environment variable will take precedence over the option specified in the method.

### Jira Configuration

In order to upload the results, some Jira configuration is mandatory.

#### Mandatory Settings

<dl>
  <dt><code>projectKey<a name="projectKey"></a></code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          The key of the Jira project.
          This option is mandatory since otherwise Xray would not know which project to save the results to.
          It is used in many places throughout the plugin, for example for mapping Cypress tests to existing test issues in Xray (see <a href="https://github.com/cypress-xray-plugin/TODO">targeting existing test issues</a>).
        </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>JIRA_PROJECT_KEY</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code>string</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>"CYP"</code>
        </dd>
    </dl>
  </dd>
</dl>

#### Optional Settings

<dl>
  <dt><code>serverUrl</code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          When using a server-based Jira/Xray instance, use this parameter to specify the URL of your instance.
        </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>JIRA_SERVER_URL</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code>string</code>
        </dd>
        <dt><b><i>Default</i></b></dt>
        <dd>
          <code>undefined</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>"https://example.org/development/jira"</code>
        </dd>
    </dl>
  </dd>
  <dt><code>testExecutionIssueKey</code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          The key of the test execution issue to attach the run results to.
          If undefined, Jira will always create a new test execution issue with each upload.
          <br/>
          <b>Note</b>: must be prefixed with the <a href="#projectKey">project key</a>.
        </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>JIRA_TEST_EXECUTION_ISSUE_KEY</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code>string</code>
        </dd>
        <dt><b><i>Default</i></b></dt>
        <dd>
          <code>undefined</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>"CYP-123"</code>
        </dd>
    </dl>
  </dd>
  <dt><code>testPlanIssueKey</code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          A test plan issue key to attach the execution to.
          <br/>
          <b>Note</b>: must be prefixed with the <a href="#projectKey">project key</a>.
        </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>JIRA_TEST_PLAN_ISSUE_KEY</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code>string</code>
        </dd>
        <dt><b><i>Default</i></b></dt>
        <dd>
          <code>undefined</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>"CYP-456"</code>
        </dd>
    </dl>
  </dd>
</dl>

### Xray Configuration

You can also provide a bunch of Xray settings which might become necessary depending on your project configuration.

#### Optional Settings

<dl>
  <dt><code>uploadResults</code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          Turns execution results upload on or off.
        </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>XRAY_UPLOAD_RESULTS</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code><a href="#custom-option-types">boolean</a></code>
        </dd>
        <dt><b><i>Default</i></b></dt>
        <dd>
          <code>true</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>false</code>
        </dd>
    </dl>
  </dd>
  <dt><code>statusPassed</code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          The status name of a test marked as passed in Xray.
          Should be used when custom status names have been setup in Xray.
        </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>XRAY_STATUS_PASSED</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code>string</code>
        </dd>
        <dt><b><i>Default</i></b></dt>
        <dd>
          <code>"PASSED"</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>"SUCCESS"</code>
        </dd>
    </dl>
  </dd>
  <dt><code>statusFailed</code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          The status name of a test marked as failed in Xray.
          Should be used when custom status names have been setup in Xray.
        </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>XRAY_STATUS_FAILED</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code>string</code>
        </dd>
        <dt><b><i>Default</i></b></dt>
        <dd>
          <code>"FAILED"</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>"FAILURE"</code>
        </dd>
    </dl>
  </dd>
  <dt><code>testType</code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          The test type of the test issues.
          This option will be used to set the corresponding field on Xray issues created during upload (happens when a test does not yet have a corresponding Xray issue).
        </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>XRAY_TEST_TYPE</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code>string</code>
        </dd>
        <dt><b><i>Default</i></b></dt>
        <dd>
          <code>"Manual"</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>"Cucumber"</code>
        </dd>
    </dl>
  </dd>
</dl>

### Cucumber Configuration

When Cucumber is enabled, you can use the following options to configure the way the plugin works with your feature files.

#### Optional Settings

<dl>
  <dt><code>featureFileExtension</code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          The file extension of feature files you want to run in Cypress.
          </br>
          The plugin will use this to parse all matching files to extract any tags contained within them.
          Such tags are needed to identify to which test issue a feature file belongs (see <a href="https://github.com/cypress-xray-plugin/TODO">targeting existing test issues with Cucumber</a>).
        </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>CUCUMBER_FEATURE_FILE_EXTENSION</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code>string</code>
        </dd>
        <dt><b><i>Default</i></b></dt>
        <dd>
          <code>".feature"</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>".cucumber"</code>
        </dd>
    </dl>
  </dd>
  <dt><code>uploadFeatures</code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          Set it to true to automatically create or update existing Xray issues (summary, steps), based on the feature file executed by Cypress.
          <br/>
          <b>Note</b>: Enable this option if the source of truth for test cases are local feature files in Cypress and Xray is only used for tracking execution status/history.
        </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>CUCUMBER_UPLOAD_FEATURES</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code><a href="#custom-option-types">boolean</a></code>
        </dd>
        <dt><b><i>Default</i></b></dt>
        <dd>
          <code>false</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>true</code>
        </dd>
    </dl>
  </dd>
  <dt>(upcoming) <code>downloadFeatures</code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          Set it to true to automatically download feature files from Xray for Cypress to execute.
          <br/>
          <b>Note</b>: Enable this option if the source of truth for test cases are step definitions in Xray and Cypress is only used for running tests.
        </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>CUCUMBER_DOWNLOAD_FEATURES</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code><a href="#custom-option-types">boolean</a></code>
        </dd>
        <dt><b><i>Default</i></b></dt>
        <dd>
          <code>false</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>true</code>
        </dd>
    </dl>
  </dd>
</dl>

### Plugin Configuration

The plugin offers several options for customizing the upload further.

#### Optional Settings

<dl>
  <dt><code>overwriteIssueSummary</code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          Decide whether to keep the issues' existing summaries or whether to overwrite them with each upload.
        </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>PLUGIN_OVERWRITE_ISSUE_SUMMARY</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code><a href="#custom-option-types">boolean</a></code>
        </dd>
        <dt><b><i>Default</i></b></dt>
        <dd>
          <code>false</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>true</code>
        </dd>
    </dl>
  </dd>
  <dt><code>normalizeScreenshotNames</code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          Some Xray setups might struggle with uploaded evidence if the filenames contain non-ASCII characters.
          With this option enabled, the plugin only allows characters <code>a-zA-Z0-9.</code> in screenshot names and replaces all other sequences with <code>_</code>.
        </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>PLUGIN_NORMALIZE_SCREENSHOT_NAMES</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code><a href="#custom-option-types">boolean</a></code>
        </dd>
        <dt><b><i>Default</i></b></dt>
        <dd>
          <code>false</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>true</code>
        </dd>
    </dl>
  </dd>
</dl>

### OpenSSL Configuration

> **Note**
> This is an advanced section. Make sure to check out the [examples](https://github.com/cypress-xray-plugin/TODO) to see in which scenarios changing OpenSSL configurations might make sense.

Sometimes it is necessary to configure OpenSSL if your Jira Xray instance sits behind a proxy or uses dedicated root certificates that aren't available by default.
In this case, you can set the following options prior to running your Cypress tests to configure the plugin's internal OpenSSL setup:

<dl>
  <dt><code>rootCAPath</code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          Specify the path to a root CA in <code>.pem</code> format.
          This will then be used during authentication against & communication with the Xray instance.
        </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>OPENSSL_ROOT_CA_PATH</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code>string</code>
        </dd>
        <dt><b><i>Default</i></b></dt>
        <dd>
          <code>undefined</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>"/home/cert.pem"</code>
        </dd>
    </dl>
  </dd>
  <dt><code>secureOptions</code></dt>
  <dd>
    <dl>
        <dt><b><i>Description</i></b></dt>
        <dd>
          A <a href="https://nodejs.org/api/crypto.html#crypto-constants">crypto constant</a> (see list below) that will be used to configure the <code>securityOptions</code> of the <a href="https://nodejs.org/api/https.html#class-httpsagent">https.Agent</a> used for sending requests to your Xray instance.
          <br/>
          <b>Note</b>: Compute their bitwise OR if you need to set more than one option.
          <br/>
<details>
<summary>List of Security Options</summary>
This list of OpenSSL security option constants can be obtained by running the following code in a node environment:

```js
import { constants } from "crypto";
console.log(constants);
```

| Name                                            | Value      |
| ----------------------------------------------- | ---------- |
| `OPENSSL_VERSION_NUMBER`                        | 805306480  |
| `SSL_OP_ALL`                                    | 2147485776 |
| `SSL_OP_ALLOW_NO_DHE_KEX`                       | 1024       |
| `SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION`      | 262144     |
| `SSL_OP_CIPHER_SERVER_PREFERENCE`               | 4194304    |
| `SSL_OP_CISCO_ANYCONNECT`                       | 32768      |
| `SSL_OP_COOKIE_EXCHANGE`                        | 8192       |
| `SSL_OP_CRYPTOPRO_TLSEXT_BUG`                   | 2147483648 |
| `SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS`            | 2048       |
| `SSL_OP_EPHEMERAL_RSA`                          | 0          |
| `SSL_OP_LEGACY_SERVER_CONNECT`                  | 4          |
| `SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER`             | 0          |
| `SSL_OP_MICROSOFT_SESS_ID_BUG`                  | 0          |
| `SSL_OP_MSIE_SSLV2_RSA_PADDING`                 | 0          |
| `SSL_OP_NETSCAPE_CA_DN_BUG`                     | 0          |
| `SSL_OP_NETSCAPE_CHALLENGE_BUG`                 | 0          |
| `SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG`        | 0          |
| `SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG`       | 0          |
| `SSL_OP_NO_COMPRESSION`                         | 131072     |
| `SSL_OP_NO_ENCRYPT_THEN_MAC`                    | 524288     |
| `SSL_OP_NO_QUERY_MTU`                           | 4096       |
| `SSL_OP_NO_RENEGOTIATION`                       | 1073741824 |
| `SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION` | 65536      |
| `SSL_OP_NO_SSLv2`                               | 0          |
| `SSL_OP_NO_SSLv3`                               | 33554432   |
| `SSL_OP_NO_TICKET`                              | 16384      |
| `SSL_OP_NO_TLSv1`                               | 67108864   |
| `SSL_OP_NO_TLSv1_1`                             | 268435456  |
| `SSL_OP_NO_TLSv1_2`                             | 134217728  |
| `SSL_OP_NO_TLSv1_3`                             | 536870912  |
| `SSL_OP_PKCS1_CHECK_1`                          | 0          |
| `SSL_OP_PKCS1_CHECK_2`                          | 0          |
| `SSL_OP_PRIORITIZE_CHACHA`                      | 2097152    |
| `SSL_OP_SINGLE_DH_USE`                          | 0          |
| `SSL_OP_SINGLE_ECDH_USE`                        | 0          |
| `SSL_OP_SSLEAY_080_CLIENT_DH_BUG`               | 0          |
| `SSL_OP_SSLREF2_REUSE_CERT_TYPE_BUG`            | 0          |
| `SSL_OP_TLS_BLOCK_PADDING_BUG`                  | 0          |
| `SSL_OP_TLS_D5_BUG`                             | 0          |
| `SSL_OP_TLS_ROLLBACK_BUG`                       | 8388608    |
| `ENGINE_METHOD_RSA`                             | 1          |
| `ENGINE_METHOD_DSA`                             | 2          |
| `ENGINE_METHOD_DH`                              | 4          |
| `ENGINE_METHOD_RAND`                            | 8          |
| `ENGINE_METHOD_EC`                              | 2048       |
| `ENGINE_METHOD_CIPHERS`                         | 64         |
| `ENGINE_METHOD_DIGESTS`                         | 128        |
| `ENGINE_METHOD_PKEY_METHS`                      | 512        |
| `ENGINE_METHOD_PKEY_ASN1_METHS`                 | 1024       |
| `ENGINE_METHOD_ALL`                             | 65535      |
| `ENGINE_METHOD_NONE`                            | 0          |
| `DH_CHECK_P_NOT_SAFE_PRIME`                     | 2          |
| `DH_CHECK_P_NOT_PRIME`                          | 1          |
| `DH_UNABLE_TO_CHECK_GENERATOR`                  | 4          |
| `DH_NOT_SUITABLE_GENERATOR`                     | 8          |
| `ALPN_ENABLED`                                  | 1          |
| `RSA_PKCS1_PADDING`                             | 1          |
| `RSA_NO_PADDING`                                | 3          |
| `RSA_PKCS1_OAEP_PADDING`                        | 4          |
| `RSA_X931_PADDING`                              | 5          |
| `RSA_PKCS1_PSS_PADDING`                         | 6          |
| `RSA_PSS_SALTLEN_DIGEST`                        | -1         |
| `RSA_PSS_SALTLEN_MAX_SIGN`                      | -2         |
| `RSA_PSS_SALTLEN_AUTO`                          | -2         |
| `TLS1_VERSION`                                  | 769        |
| `TLS1_1_VERSION`                                | 770        |
| `TLS1_2_VERSION`                                | 771        |
| `TLS1_3_VERSION`                                | 772        |
| `POINT_CONVERSION_COMPRESSED`                   | 2          |
| `POINT_CONVERSION_UNCOMPRESSED`                 | 4          |
| `POINT_CONVERSION_HYBRID`                       | 6          |

</details>
    </dd>
        <dt><b><i>Environment variable</i></b></dt>
        <dd>
          <code>OPENSSL_SECURE_OPTIONS</code>
        </dd>
        <dt><b><i>Type</i></b></dt>
        <dd>
          <code>number</code>
        </dd>
        <dt><b><i>Default</i></b></dt>
        <dd>
          <code>undefined</code>
        </dd>
        <dt><b><i>Example</i></b></dt>
        <dd>
          <code>262148</code>
          <br/>
          Or more readable:

```js
import { constants } from "crypto";
// ...
openSSL: {
    secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT |
        constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION;
}
// ...
```

</dd>
    </dl>
  </dd>
</dl>

### Custom Option Types

Here you will find the valid values of option types used throughout the configuration explanations.

| Option Type | Valid Values                                                      |
| ----------- | ----------------------------------------------------------------- |
| `boolean`   | `true`, `1`, `yes`, `y`, `on` <br> `false`, `0`, `no`, `n`, `off` |
