import { AstBuilder, GherkinClassicTokenMatcher, Parser } from "@cucumber/gherkin";
import {
    Background,
    Comment,
    GherkinDocument,
    IdGenerator,
    Scenario,
    Tag,
} from "@cucumber/messages";
import fs from "fs";
import { logWarning } from "../logging/logging";
import { InternalOptions, Options } from "../types/plugin";
import { dedent } from "../util/dedent";
import { errorMessage } from "../util/error";

// ============================================================================================== //
// CYPRESS NATIVE                                                                                 //
// ============================================================================================== //

export function containsNativeTest(
    runResult: CypressCommandLine.CypressRunResult,
    options: Options
): boolean {
    return runResult.runs.some((run: CypressCommandLine.RunResult) => {
        if (options.cucumber && run.spec.absolute.endsWith(options.cucumber.featureFileExtension)) {
            return false;
        }
        return true;
    });
}

export function getNativeTestIssueKeys(
    results: CypressCommandLine.CypressRunResult,
    options: InternalOptions
): string[] {
    const issueKeys: string[] = [];
    for (const runResult of results.runs) {
        const keyedTests: CypressCommandLine.TestResult[] = [];
        // Cucumber tests aren't handled here. Let's skip them.
        if (
            options.cucumber &&
            runResult.spec.absolute.endsWith(options.cucumber.featureFileExtension)
        ) {
            continue;
        }
        for (const testResult of runResult.tests) {
            const title = testResult.title.join(" ");
            try {
                // The last element refers to an individual test (it).
                // The ones before are test suite titles (describe, context, ...).
                const issueKey = getNativeTestIssueKey(
                    testResult.title[testResult.title.length - 1],
                    options.jira.projectKey
                );
                keyedTests.push(testResult);
                issueKeys.push(issueKey);
            } catch (error: unknown) {
                logWarning(`Skipping test: ${title}\n\n${errorMessage(error)}`);
            }
        }
        runResult.tests = keyedTests;
    }
    return issueKeys;
}

/**
 * Extracts a Jira issue key from a native Cypress test title, based on the provided project key.
 *
 * @param title the test title
 * @param projectKey the Jira projectk key
 * @returns the Jira issue key
 * @throws if the title contains zero or more than one issue key
 */
export function getNativeTestIssueKey(title: string, projectKey: string): string | null {
    const regex = new RegExp(`(${projectKey}-\\d+)`, "g");
    const matches = title.match(regex);
    if (!matches) {
        throw new Error(
            dedent(`
                No test issue keys found in title of test: ${title}
                You can target existing test issues by adding a corresponding issue key:

                it("${projectKey}-123 ${title}", () => {
                  // ...
                });

                For more information, visit:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
            `)
        );
    } else if (matches.length === 1) {
        return matches[0];
    } else {
        // Remove any circumflexes currently present in the title.
        let indicatorLine = title.replaceAll("^", " ");
        matches.forEach((match: string) => {
            indicatorLine = indicatorLine.replaceAll(match, "^".repeat(match.length));
        });
        // Replace everything but circumflexes with space.
        indicatorLine = indicatorLine.replaceAll(/[^^]/g, " ");
        throw new Error(
            dedent(`
                Multiple test keys found in title of test: ${title}
                The plugin cannot decide for you which one to use:

                it("${title}", () => {
                    ${indicatorLine}
                  // ...
                });

                For more information, visit:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
            `)
        );
    }
}

// ============================================================================================== //
// CUCUMBER                                                                                       //
// ============================================================================================== //

export function containsCucumberTest(
    runResult: CypressCommandLine.CypressRunResult,
    options: Options
): boolean {
    return runResult.runs.some((run: CypressCommandLine.RunResult) => {
        if (options.cucumber && run.spec.absolute.endsWith(options.cucumber.featureFileExtension)) {
            return true;
        }
        return false;
    });
}

export interface FeatureFileIssueData {
    tests: FeatureFileIssueDataTest[];
    preconditions: FeatureFileIssueDataPrecondition[];
}

export interface FeatureFileIssueDataTest {
    key: string;
    summary: string;
    tags: string[];
}

export interface FeatureFileIssueDataPrecondition {
    key: string;
    summary: string;
}

export function getCucumberIssueData(
    filePath: string,
    options: InternalOptions,
    isCloudClient: boolean
): FeatureFileIssueData {
    const featureFileIssueKeys: FeatureFileIssueData = {
        tests: [],
        preconditions: [],
    };
    const document = parseFeatureFile(filePath);
    for (const child of document.feature.children) {
        if (child.scenario) {
            const issueKeys = getCucumberScenarioIssueTags(
                child.scenario,
                options.jira.projectKey,
                isCloudClient
            );
            if (issueKeys.length === 0) {
                throw new Error(
                    dedent(`
                        No test issue keys found in tags of scenario: ${child.scenario.name}
                        You can target existing test issues by adding a corresponding tag:

                        ${getScenarioTag(options.jira.projectKey, isCloudClient)}
                        ${getScenarioLine(child.scenario)}
                          # steps ...

                        For more information, visit:
                        - ${getHelpUrl(isCloudClient)}
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
            } else if (issueKeys.length > 1) {
                throw new Error(
                    dedent(`
                        Multiple test issue keys found in tags of scenario: ${child.scenario.name}
                        The plugin cannot decide for you which one to use:

                        ${getScenarioMultipleTagsLine(child.scenario)}
                        ${getScenarioMultipleTagsIndicatorLine(child.scenario, issueKeys)}
                        ${getScenarioLine(child.scenario)}
                          # steps ...

                        For more information, visit:
                        - ${getHelpUrl(isCloudClient)}
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
            }
            featureFileIssueKeys.tests.push({
                key: issueKeys[0],
                summary: child.scenario.name ? child.scenario.name : "<empty>",
                tags: child.scenario.tags.map((tag) => tag.name.replace("@", "")),
            });
        } else if (child.background) {
            const preconditionKeys = getCucumberPreconditionIssueTags(
                child.background,
                options.jira.projectKey,
                isCloudClient,
                document.comments
            );
            if (preconditionKeys.length === 0) {
                throw new Error(
                    dedent(`
                        No precondition issue keys found in comments of background: ${
                            child.background.name
                        }
                        You can target existing precondition issues by adding a corresponding comment:

                        ${getBackgroundLine(child.background)}
                          ${getBackgroundTag(options.jira.projectKey, isCloudClient)}
                          # steps ...

                        For more information, visit:
                        - ${getHelpUrl(isCloudClient)}
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
            } else if (preconditionKeys.length > 1) {
                throw new Error(
                    dedent(`
                        Multiple precondition issue keys found in comments of background: ${
                            child.background.name
                        }
                        The plugin cannot decide for you which one to use:

                        ${reconstructMultipleTagsBackground(
                            child.background,
                            preconditionKeys,
                            document.comments
                        )}

                        For more information, visit:
                        - ${getHelpUrl(isCloudClient)}
                        - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    `)
                );
            }
            featureFileIssueKeys.preconditions.push({
                key: preconditionKeys[0],
                summary: child.background.name ? child.background.name : "<empty>",
            });
        }
    }
    return featureFileIssueKeys;
}

function getHelpUrl(isCloudClient: boolean): string {
    return isCloudClient
        ? "https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2"
        : "https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST";
}

function getScenarioLine(scenario: Scenario): string {
    return `${scenario.keyword}: ${scenario.name}`;
}

function getScenarioTag(projectKey: string, isCloudClient: boolean): string {
    return isCloudClient ? `@TestName:${projectKey}-123` : `@${projectKey}-123`;
}

function getScenarioMultipleTagsLine(scenario: Scenario): string {
    return scenario.tags.map((tag: Tag) => tag.name).join(" ");
}

function getScenarioMultipleTagsIndicatorLine(scenario: Scenario, issueKeys: string[]): string {
    const indicatorLine = scenario.tags
        .map((tag: Tag) => {
            if (issueKeys.some((key) => tag.name.endsWith(key))) {
                return "^".repeat(tag.name.length);
            }
            return " ".repeat(tag.name.length);
        })
        .join(" ")
        .trimEnd();
    return indicatorLine;
}

function getBackgroundLine(background: Background): string {
    return `${background.keyword}: ${background.name}`;
}

function getBackgroundTag(projectKey: string, isCloudClient: boolean): string {
    return isCloudClient ? `#@Precondition:${projectKey}-123` : `#@${projectKey}-123`;
}

function reconstructMultipleTagsBackground(
    background: Background,
    preconditionIssueKeys: string[],
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
    example.push("  # steps ...");
    return example.join("\n");
}
/**
 * Parses a Gherkin document (feature file) and returns the information contained within.
 *
 * @param file the path to the feature file
 * @param encoding the file's encoding
 * @returns an object containing the data of the feature file
 * @example
 *   const data = parseFeatureFile("myTetest.feature")
 *   console.log(data.feature.children[0].scenario); // steps, name, ...
 * @see https://github.com/cucumber/messages/blob/main/javascript/src/messages.ts
 */
export function parseFeatureFile(
    file: string,
    encoding: BufferEncoding = "utf-8"
): GherkinDocument {
    const uuidFn = IdGenerator.uuid();
    const builder = new AstBuilder(uuidFn);
    const matcher = new GherkinClassicTokenMatcher();
    const parser = new Parser(builder, matcher);
    return parser.parse(fs.readFileSync(file, { encoding: encoding }));
}

export function getCucumberScenarioIssueTags(
    scenario: Scenario,
    projectKey: string,
    isCloudClient: boolean
): string[] {
    const issueKeys: string[] = [];
    for (const tag of scenario.tags) {
        const matches = tag.name.match(scenarioRegex(projectKey, isCloudClient));
        if (!matches) {
            continue;
        } else if (matches.length === 2) {
            issueKeys.push(matches[1]);
        }
    }
    return issueKeys;
}

function scenarioRegex(projectKey: string, isCloudClient: boolean) {
    if (isCloudClient) {
        // @TestName:CYP-123
        return new RegExp(`@TestName:(${projectKey}-\\d+)`);
    }
    // @CYP-123
    return new RegExp(`@(${projectKey}-\\d+)`);
}

export function getCucumberPreconditionIssueTags(
    background: Background,
    projectKey: string,
    isCloudClient: boolean,
    comments: readonly Comment[]
): string[] {
    const preconditionKeys: string[] = [];
    if (background.steps.length > 0) {
        const backgroundLine = background.location.line;
        const firstStepLine = background.steps[0].location.line;
        for (const comment of comments) {
            if (comment.location.line > backgroundLine && comment.location.line < firstStepLine) {
                const matches = comment.text.match(backgroundRegex(projectKey, isCloudClient));
                if (!matches) {
                    continue;
                } else if (matches.length === 2) {
                    preconditionKeys.push(matches[1]);
                }
            }
        }
    }
    return preconditionKeys;
}

function backgroundRegex(projectKey: string, isCloudClient: boolean) {
    if (isCloudClient) {
        // @Precondition:CYP-111
        return new RegExp(`@Precondition:(${projectKey}-\\d+)`);
    }
    // @CYP-111
    return new RegExp(`@(${projectKey}-\\d+)`);
}
