import { Background, Comment } from "@cucumber/messages";
import { SupportedFields } from "../repository/jira/fields/jiraIssueFetcher";
import { FieldDetail } from "../types/jira/responses/fieldDetail";
import { JiraFieldIds } from "../types/plugin";
import { StringMap } from "../types/util";
import { dedent } from "./dedent";
import { HELP } from "./help";
import { prettyPadObjects, prettyPadValues } from "./pretty";
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

// ============================================================================================== //
// COLLECTION OF USEFUL ERRORS                                                                    //
// ============================================================================================== //

/**
 * Returns an error describing that a test issue key is missing in the title of a native Cypress
 * test case.
 *
 * @param title - the Cypress test title
 * @param projectKey - the project key
 * @returns the error
 */
export function missingTestKeyInNativeTestTitleError(title: string, projectKey: string): Error {
    return new Error(
        dedent(`
            No test issue keys found in title of test: ${title}
            You can target existing test issues by adding a corresponding issue key:

            it("${projectKey}-123 ${title}", () => {
              // ...
            });

            For more information, visit:
            - ${HELP.plugin.guides.targetingExistingIssues}
        `)
    );
}

/**
 * Returns an error describing that multiple test issue keys are present in the title of a native
 * Cypress test case.
 *
 * @param title - the Cypress test title
 * @param issueKeys - the issue keys
 * @returns the error
 */
export function multipleTestKeysInNativeTestTitleError(
    title: string,
    issueKeys: readonly string[]
): Error {
    // Remove any circumflexes currently present in the title.
    let indicatorLine = title.replaceAll("^", " ");
    issueKeys.forEach((issueKey: string) => {
        indicatorLine = indicatorLine.replaceAll(issueKey, "^".repeat(issueKey.length));
    });
    // Replace everything but circumflexes with space.
    indicatorLine = indicatorLine.replaceAll(/[^^]/g, " ");
    return new Error(
        dedent(`
            Multiple test keys found in title of test: ${title}
            The plugin cannot decide for you which one to use:

            it("${title}", () => {
                ${indicatorLine}
              // ...
            });

            For more information, visit:
            - ${HELP.plugin.guides.targetingExistingIssues}
        `)
    );
}

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
        name: string;
        keyword: string;
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
                No test issue keys found in tags of scenario${
                    scenario.name.length > 0 ? `: ${scenario.name}` : ""
                }

                Available tags:
                  ${scenario.tags.map((tag) => tag.name).join("\n")}

                If a tag contains the test issue key already, specify a global prefix to align the plugin with Xray

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
            No test issue keys found in tags of scenario${
                scenario.name.length > 0 ? `: ${scenario.name}` : ""
            }

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
 * @param testPrefix - the prefix of issues linked in scenario tags
 * @returns the error
 */
export function multipleTestKeysInCucumberScenarioError(
    scenario: {
        name: string;
        keyword: string;
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
            Multiple test issue keys found in tags of scenario${
                scenario.name.length > 0 ? `: ${scenario.name}` : ""
            }
            The plugin cannot decide for you which one to use:

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

/**
 * Returns an error describing that a test issue key is missing in the comments of a Cucumber
 * background.
 *
 * @param background - the Cucumber background
 * @param projectKey - the project key
 * @param isCloudClient - whether Xray cloud is being used
 * @param comments - the comments containing precondition issue keys
 * @returns the error
 */
export function missingPreconditionKeyInCucumberBackgroundError(
    background: Background,
    projectKey: string,
    isCloudClient: boolean,
    comments?: readonly string[]
): Error {
    const firstStepLine =
        background.steps.length > 0
            ? `${background.steps[0].keyword.trim()} ${background.steps[0].text}`
            : "Given A step";
    if (comments && comments.length > 0) {
        return new Error(
            dedent(`
                No precondition issue keys found in comments of background${
                    background.name.length > 0 ? `: ${background.name}` : ""
                }

                Available comments:
                  ${comments.join("\n")}

                If a comment contains the precondition issue key already, specify a global prefix to align the plugin with Xray

                  For example, with the following plugin configuration:

                    {
                      cucumber: {
                        prefixes: {
                          precondition: "Precondition:"
                        }
                      }
                    }

                  The following comment will be recognized as a precondition issue tag by the plugin:

                    ${background.keyword}: ${background.name}
                      #@Precondition:${projectKey}-123
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
            No precondition issue keys found in comments of background${
                background.name.length > 0 ? `: ${background.name}` : ""
            }

            You can target existing precondition issues by adding a corresponding comment:

              ${background.keyword}: ${background.name}
                #@${projectKey}-123
                ${firstStepLine}
                ...

            You can also specify a prefix to match the tagging scheme configured in your Xray instance:

              Plugin configuration:

                {
                  cucumber: {
                    prefixes: {
                      precondition: "Precondition:"
                    }
                  }
                }

              Feature file:

                ${background.keyword}: ${background.name}
                  #@Precondition:${projectKey}-123
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
 * Returns an error describing that multiple test issue keys are present in the comments of a
 * Cucumber background.
 *
 * @param background - the Cucumber background
 * @param preconditionKeys - the issue keys
 * @param comments - the precondition comments
 * @param isCloudClient - whether Xray cloud is being used
 * @returns the error
 */
export function multiplePreconditionKeysInCucumberBackgroundError(
    background: Background,
    preconditionKeys: readonly string[],
    comments: readonly Comment[],
    isCloudClient: boolean
): Error {
    return new Error(
        dedent(`
            Multiple precondition issue keys found in comments of background${
                background.name.length > 0 ? `: ${background.name}` : ""
            }
            The plugin cannot decide for you which one to use:

            ${reconstructMultipleTagsBackground(background, preconditionKeys, comments)}

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

function reconstructMultipleTagsBackground(
    background: Background,
    preconditionIssueKeys: readonly string[],
    comments: readonly Comment[]
): string {
    const example: string[] = [];
    const backgroundLine = background.location.line;
    const firstStepLine = background.steps[0].location.line;
    example.push(`${background.keyword}: ${background.name}`);
    for (const comment of comments) {
        if (comment.location.line > backgroundLine && comment.location.line < firstStepLine) {
            example.push(`  ${comment.text.trimStart()}`);
            if (preconditionIssueKeys.some((key: string) => comment.text.endsWith(key))) {
                example.push(`  ${comment.text.replaceAll(/\S/g, "^").trimStart()}`);
            }
        }
    }
    example.push(
        background.steps.length > 0
            ? `  ${background.steps[0].keyword.trim()} ${background.steps[0].text}`
            : "  Given A step"
    );
    example.push("  ...");
    return example.join("\n");
}

export function multipleFieldsError(fieldName: SupportedFields, matches: FieldDetail[]): Error {
    const nameDuplicates = prettyPadObjects(matches)
        .map((duplicate) =>
            Object.entries(duplicate)
                .map((entry) => `${entry[0]}: ${entry[1]}`)
                .join(", ")
        )
        .sort()
        .join("\n");
    const idSuggestions = matches.map((field: FieldDetail) => `"${field.id}"`).join(" or ");
    return new Error(
        dedent(`
            Failed to fetch Jira field ID for field with name: ${fieldName}
            There are multiple fields with this name

            Duplicates:
              ${nameDuplicates}

            You can provide field IDs in the options:

              jira: {
                fields: {
                  ${getOptionName(fieldName)}: // ${idSuggestions}
                }
              }
        `)
    );
}

export function missingFieldsError(fieldName: SupportedFields, names: StringMap<string>): Error {
    if (Object.keys(names).length === 0) {
        throw new Error(
            dedent(`
                Failed to fetch Jira field ID for field with name: ${fieldName}
                Make sure the field actually exists and that your Jira language settings did not modify the field's name

                You can provide field IDs directly without relying on language settings:

                  jira: {
                    fields: {
                      ${getOptionName(fieldName)}: // corresponding field ID
                    }
                  }
            `)
        );
    } else {
        const availableFields = Object.entries(prettyPadValues(names))
            .map((entry) => `name: ${entry[1]} id: ${JSON.stringify(entry[0])}`)
            .sort();
        throw new Error(
            dedent(`
                Failed to fetch Jira field ID for field with name: ${fieldName}
                Make sure the field actually exists and that your Jira language settings did not modify the field's name

                Available fields:
                  ${availableFields.join("\n")}

                You can provide field IDs directly without relying on language settings:

                  jira: {
                    fields: {
                      ${getOptionName(fieldName)}: // corresponding field ID
                    }
                  }
            `)
        );
    }
}

function getOptionName(fieldName: SupportedFields): keyof JiraFieldIds {
    switch (fieldName) {
        case SupportedFields.DESCRIPTION:
            return "description";
        case SupportedFields.SUMMARY:
            return "summary";
        case SupportedFields.LABELS:
            return "labels";
        case SupportedFields.TEST_ENVIRONMENTS:
            return "testEnvironments";
        case SupportedFields.TEST_PLAN:
            return "testPlan";
        case SupportedFields.TEST_TYPE:
            return "testType";
    }
}
