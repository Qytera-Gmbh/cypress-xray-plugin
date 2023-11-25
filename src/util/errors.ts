import { Background, Comment } from "@cucumber/messages";
import { dedent } from "./dedent";
import { HELP } from "./help";

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
    return `${error}`;
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
 * @param expectedCloudTags - whether Xray cloud tags were expected
 * @returns the error
 */
export function missingTestKeyInCucumberScenarioError(
    scenario: {
        name: string;
        keyword: string;
        steps: readonly { keyword: string; text: string }[];
    },
    projectKey: string,
    expectedCloudTags: boolean
): Error {
    const firstStepLine =
        scenario.steps.length > 0
            ? `${scenario.steps[0].keyword.trim()} ${scenario.steps[0].text}`
            : "Given A step";
    return new Error(
        dedent(`
            No test issue keys found in tags of scenario: ${scenario.name}
            You can target existing test issues by adding a corresponding tag:

            ${expectedCloudTags ? `@TestName:${projectKey}-123` : `@${projectKey}-123`}
            ${scenario.keyword}: ${scenario.name}
              ${firstStepLine}
              ...

            For more information, visit:
            - ${
                expectedCloudTags
                    ? HELP.xray.importCucumberTests.cloud
                    : HELP.xray.importCucumberTests.server
            }
            - ${HELP.plugin.guides.targetingExistingIssues}
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
 * @param expectedCloudTags - whether Xray cloud tags were expected
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
    expectedCloudTags: boolean
): Error {
    const firstStepLine =
        scenario.steps.length > 0
            ? `${scenario.steps[0].keyword.trim()} ${scenario.steps[0].text}`
            : "Given A step";
    return new Error(
        dedent(`
            Multiple test issue keys found in tags of scenario: ${scenario.name}
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
                expectedCloudTags
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
 * @param expectedCloudTags - whether Xray cloud tags were expected
 * @returns the error
 */
export function missingPreconditionKeyInCucumberBackgroundError(
    background: Background,
    projectKey: string,
    expectedCloudTags: boolean
): Error {
    const firstStepLine =
        background.steps.length > 0
            ? `${background.steps[0].keyword.trim()} ${background.steps[0].text}`
            : "Given A step";
    return new Error(
        dedent(`
            No precondition issue keys found in comments of background: ${background.name}
            You can target existing precondition issues by adding a corresponding comment:

            ${background.keyword}: ${background.name}
              ${expectedCloudTags ? `#@Precondition:${projectKey}-123` : `#@${projectKey}-123`}
              ${firstStepLine}
              ...

            For more information, visit:
            - ${
                expectedCloudTags
                    ? HELP.xray.importCucumberTests.cloud
                    : HELP.xray.importCucumberTests.server
            }
            - ${HELP.plugin.guides.targetingExistingIssues}
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
 * @param expectedCloudTags - whether Xray cloud tags were expected
 * @returns the error
 */
export function multiplePreconditionKeysInCucumberBackgroundError(
    background: Background,
    preconditionKeys: readonly string[],
    comments: readonly Comment[],
    expectedCloudTags: boolean
): Error {
    return new Error(
        dedent(`
            Multiple precondition issue keys found in comments of background: ${background.name}
            The plugin cannot decide for you which one to use:

            ${reconstructMultipleTagsBackground(background, preconditionKeys, comments)}

            For more information, visit:
            - ${
                expectedCloudTags
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
