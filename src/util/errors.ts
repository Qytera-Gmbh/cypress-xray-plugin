import { dedent } from "./dedent";
import { HELP } from "./help";
import { unknownToString } from "./string";

/**
 * Returns an error message of any error.
 *
 * @param error - the error
 * @returns the error message
 */
export function errorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return unknownToString(error);
}

/**
 * An error which has been logged to a file or other log locations already.
 */
export class LoggedError extends Error {}

/**
 * Assesses whether the given error is an instance of a {@link LoggedError | `LoggedError`}.
 *
 * @param error - the error
 * @returns `true` if the error is a {@link LoggedError | `LoggedError`}, otherwise `false`
 */
export function isLoggedError(error: unknown): boolean {
    return error instanceof LoggedError;
}

/**
 * An error which is thrown when a command is skipped.
 */

export class SkippedError extends Error {}
/**
 * Assesses whether the given error is an instance of a {@link SkippedError | `SkippedError`}.
 *
 * @param error - the error
 * @returns `true` if the error is a {@link SkippedError | `SkippedError`}, otherwise `false`
 */

export function isSkippedError(error: unknown): error is SkippedError {
    return error instanceof SkippedError;
}

// ============================================================================================== //
// COLLECTION OF USEFUL ERRORS                                                                    //
// ============================================================================================== //

/**
 * Returns an error describing that a test issue key is missing in the tags of a Cucumber scenario.
 *
 * @param scenario - the Cucumber scenario
 * @param projectKey - the project key
 * @param isCloudClient - whether Xray cloud is being used
 * @returns the error
 */
export function missingTestKeyInCucumberScenarioError(
    scenario: {
        keyword: string;
        name: string;
        steps: readonly { keyword: string; text: string }[];
        tags?: readonly { name: string }[];
    },
    projectKey: string,
    isCloudClient: boolean
): Error {
    const firstStepLine =
        scenario.steps.length > 0
            ? `${scenario.steps[0].keyword.trim()} ${scenario.steps[0].text}`
            : "Given A step";
    if (scenario.tags && scenario.tags.length > 0) {
        return new Error(
            dedent(`
                Scenario: ${scenario.name.length > 0 ? scenario.name : "<no name>"}

                  No test issue keys found in tags:

                    ${scenario.tags.map((tag) => tag.name).join("\n")}

                  If a tag contains the test issue key already, specify a global prefix to align the plugin with Xray.

                    For example, with the following plugin configuration:

                      {
                        cucumber: {
                          prefixes: {
                            test: "TestName:"
                          }
                        }
                      }

                    The following tag will be recognized as a test issue tag by the plugin:

                      @TestName:${projectKey}-123
                      ${scenario.keyword}: ${scenario.name}
                        ${firstStepLine}
                        ...

                  For more information, visit:
                  - ${HELP.plugin.guides.targetingExistingIssues}
                  - ${HELP.plugin.configuration.cucumber.prefixes}
                  - ${
                      isCloudClient
                          ? HELP.xray.importCucumberTests.cloud
                          : HELP.xray.importCucumberTests.server
                  }
            `)
        );
    }
    return new Error(
        dedent(`
            Scenario: ${scenario.name.length > 0 ? scenario.name : "<no name>"}

              No test issue keys found in tags.

              You can target existing test issues by adding a corresponding tag:

                @${projectKey}-123
                ${scenario.keyword}: ${scenario.name}
                  ${firstStepLine}
                  ...

              You can also specify a prefix to match the tagging scheme configured in your Xray instance:

                Plugin configuration:

                  {
                    cucumber: {
                      prefixes: {
                        test: "TestName:"
                      }
                    }
                  }

                Feature file:

                  @TestName:${projectKey}-123
                  ${scenario.keyword}: ${scenario.name}
                    ${firstStepLine}
                    ...

              For more information, visit:
              - ${HELP.plugin.guides.targetingExistingIssues}
              - ${HELP.plugin.configuration.cucumber.prefixes}
              - ${
                  isCloudClient
                      ? HELP.xray.importCucumberTests.cloud
                      : HELP.xray.importCucumberTests.server
              }
        `)
    );
}

/**
 * Returns an error describing that multiple test issue keys are present in the tags of a Cucumber
 * scenario.
 *
 * @param scenario - the Cucumber scenario
 * @param tags - the scenario tags
 * @param issueKeys - the issue keys
 * @param isCloudClient - whether Xray cloud is being used
 * @returns the error
 */
export function multipleTestKeysInCucumberScenarioError(
    scenario: {
        keyword: string;
        name: string;
        steps: readonly { keyword: string; text: string }[];
    },
    tags: readonly { name: string }[],
    issueKeys: string[],
    isCloudClient: boolean
): Error {
    const firstStepLine =
        scenario.steps.length > 0
            ? `${scenario.steps[0].keyword.trim()} ${scenario.steps[0].text}`
            : "Given A step";
    return new Error(
        dedent(`
            Scenario: ${scenario.name.length > 0 ? scenario.name : "<no name>"}

              Multiple test issue keys found in tags, the plugin cannot decide for you which one to use:

                ${tags.map((tag) => tag.name).join(" ")}
                ${tags
                    .map((tag) => {
                        if (issueKeys.some((key) => tag.name.endsWith(key))) {
                            return "^".repeat(tag.name.length);
                        }
                        return " ".repeat(tag.name.length);
                    })
                    .join(" ")
                    .trimEnd()}
                ${scenario.keyword}: ${scenario.name}
                  ${firstStepLine}
                  ...

              For more information, visit:
              - ${
                  isCloudClient
                      ? HELP.xray.importCucumberTests.cloud
                      : HELP.xray.importCucumberTests.server
              }
              - ${HELP.plugin.guides.targetingExistingIssues}
        `)
    );
}
