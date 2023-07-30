# Changelog

# `4.0.0`


## Breaking changes

- Removed `plugin.overwriteIssueSummary` option
- Removed `xray.testType` option
- Removed `jira.createTestIssues` option
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
          } from  cypress-xray-plugin/plugin";
          ```
        </td>
        <td>

        ```ts
          import { addXrayResultUpload, configureXrayPlugin, syncFeatureFile} from  cypress-xray-plugin";
        ```
        </td>
      </tr>
    </tbody>
  </table>


## Notable changes

- Logging output has been beautified
- Restricted exported plugin members to those defined in `index.ts`
- Added `plugin.logDirectory` option

# `3.3.3` and before
For versions `3.3.3` and before, please check the [GitHub releases page](https://github.com/Qytera-Gmbh/cypress-xray-plugin/releases).