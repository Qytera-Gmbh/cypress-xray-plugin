import { AstBuilder, GherkinClassicTokenMatcher, Parser } from "@cucumber/gherkin";
import { Background, Comment, GherkinDocument, IdGenerator, Scenario } from "@cucumber/messages";
import fs from "fs";
import { LOG, Level } from "../logging/logging";
import { CucumberOptions } from "../types/plugin";
import {
    errorMessage,
    missingPreconditionKeyInCucumberBackgroundError,
    missingTestKeyInCucumberScenarioError,
    missingTestKeyInNativeTestTitleError,
    multiplePreconditionKeysInCucumberBackgroundError,
    multipleTestKeysInCucumberScenarioError,
    multipleTestKeysInNativeTestTitleError,
} from "../util/errors";

// ============================================================================================== //
// CYPRESS NATIVE                                                                                 //
// ============================================================================================== //

export function containsNativeTest(
    runResult: CypressCommandLine.CypressRunResult,
    featureFileExtension?: string
): boolean {
    return runResult.runs.some((run: CypressCommandLine.RunResult) => {
        if (featureFileExtension && run.spec.absolute.endsWith(featureFileExtension)) {
            return false;
        }
        return true;
    });
}

export function getNativeTestIssueKeys(
    results: CypressCommandLine.CypressRunResult,
    projectKey: string,
    featureFileExtension?: string
): string[] {
    const issueKeys: string[] = [];
    for (const runResult of results.runs) {
        const keyedTests: CypressCommandLine.TestResult[] = [];
        // Cucumber tests aren't handled here. Let's skip them.
        if (featureFileExtension && runResult.spec.absolute.endsWith(featureFileExtension)) {
            continue;
        }
        for (const testResult of runResult.tests) {
            const title = testResult.title.join(" ");
            try {
                // The last element refers to an individual test (it).
                // The ones before are test suite titles (describe, context, ...).
                const issueKey = getNativeTestIssueKey(
                    testResult.title[testResult.title.length - 1],
                    projectKey
                );
                keyedTests.push(testResult);
                issueKeys.push(issueKey);
            } catch (error: unknown) {
                LOG.message(Level.WARNING, `Skipping test: ${title}\n\n${errorMessage(error)}`);
            }
        }
        runResult.tests = keyedTests;
    }
    return issueKeys;
}

/**
 * Extracts a Jira issue key from a native Cypress test title, based on the provided project key.
 *
 * @param title - the test title
 * @param projectKey - the Jira projectk key
 * @returns the Jira issue key
 * @throws if the title contains zero or more than one issue key
 */
export function getNativeTestIssueKey(title: string, projectKey: string): string {
    const regex = new RegExp(`(${projectKey}-\\d+)`, "g");
    const matches = title.match(regex);
    if (!matches) {
        throw missingTestKeyInNativeTestTitleError(title, projectKey);
    } else if (matches.length === 1) {
        return matches[0];
    } else {
        throw multipleTestKeysInNativeTestTitleError(title, matches);
    }
}

// ============================================================================================== //
// CUCUMBER                                                                                       //
// ============================================================================================== //

export function containsCucumberTest(
    runResult: CypressCommandLine.CypressRunResult,
    featureFileExtension?: string
): boolean {
    return runResult.runs.some((run: CypressCommandLine.RunResult) => {
        if (featureFileExtension && run.spec.absolute.endsWith(featureFileExtension)) {
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
    projectKey: string,
    isCloudClient: boolean,
    prefixes?: CucumberOptions["prefixes"]
): FeatureFileIssueData {
    const featureFileIssueKeys: FeatureFileIssueData = {
        tests: [],
        preconditions: [],
    };
    const document = parseFeatureFile(filePath);
    if (!document.feature?.children) {
        return featureFileIssueKeys;
    }
    for (const child of document.feature.children) {
        if (child.scenario) {
            const issueKeys = getCucumberScenarioIssueTags(
                child.scenario,
                projectKey,
                prefixes?.test
            );
            if (issueKeys.length === 0) {
                throw missingTestKeyInCucumberScenarioError(
                    child.scenario,
                    projectKey,
                    isCloudClient
                );
            } else if (issueKeys.length > 1) {
                throw multipleTestKeysInCucumberScenarioError(
                    child.scenario,
                    child.scenario.tags,
                    issueKeys,
                    isCloudClient
                );
            }
            featureFileIssueKeys.tests.push({
                key: issueKeys[0],
                summary: child.scenario.name ? child.scenario.name : "<empty>",
                tags: child.scenario.tags.map((tag) => tag.name.replace("@", "")),
            });
        } else if (child.background) {
            const preconditionComments = getCucumberPreconditionIssueComments(
                child.background,
                projectKey,
                document.comments
            );
            const preconditionKeys = getCucumberPreconditionIssueTags(
                child.background,
                projectKey,
                preconditionComments,
                prefixes?.precondition
            );
            if (preconditionKeys.length === 0) {
                throw missingPreconditionKeyInCucumberBackgroundError(
                    child.background,
                    projectKey,
                    isCloudClient,
                    preconditionComments
                );
            } else if (preconditionKeys.length > 1) {
                throw multiplePreconditionKeysInCucumberBackgroundError(
                    child.background,
                    preconditionKeys,
                    document.comments,
                    isCloudClient
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

/**
 * Parses a Gherkin document (feature file) and returns the information contained within.
 *
 * @param file - the path to the feature file
 * @param encoding - the file's encoding
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
    testPrefix?: string
): string[] {
    const issueKeys: string[] = [];
    for (const tag of scenario.tags) {
        const matches = tag.name.match(getScenarioTagRegex(projectKey, testPrefix));
        if (!matches) {
            continue;
        } else if (matches.length === 2) {
            issueKeys.push(matches[1]);
        }
    }
    return issueKeys;
}

export function getScenarioTagRegex(projectKey: string, testPrefix?: string) {
    if (testPrefix) {
        // @TestName:CYP-123
        return new RegExp(`@${testPrefix}(${projectKey}-\\d+)`);
    }
    // @CYP-123
    return new RegExp(`@(${projectKey}-\\d+)`);
}

/**
 * Extracts all comments which are relevant for linking a background to precondition issues.
 *
 * @param background - the background
 * @param projectKey - the project key
 * @param comments - the feature file comments
 * @returns the relevant comments
 */
export function getCucumberPreconditionIssueComments(
    background: Background,
    projectKey: string,
    comments: readonly Comment[]
): string[] {
    if (background.steps.length === 0) {
        return [];
    }
    const backgroundLine = background.location.line;
    const firstStepLine = background.steps[0].location.line;
    return comments
        .filter((comment: Comment) => comment.location.line > backgroundLine)
        .filter((comment: Comment) => comment.location.line < firstStepLine)
        .filter((comment: Comment) => new RegExp(`@\\S*${projectKey}-\\d+`).test(comment.text))
        .map((comment: Comment) => comment.text.trim());
}

export function getCucumberPreconditionIssueTags(
    background: Background,
    projectKey: string,
    comments: readonly string[],
    preconditionPrefix?: string
): string[] {
    const preconditionKeys: string[] = [];
    if (background.steps.length > 0) {
        for (const comment of comments) {
            const matches = comment.match(backgroundRegex(projectKey, preconditionPrefix));
            if (!matches) {
                continue;
            } else if (matches.length === 2) {
                preconditionKeys.push(matches[1]);
            }
        }
    }
    return preconditionKeys;
}

function backgroundRegex(projectKey: string, preconditionPrefix?: string) {
    if (preconditionPrefix) {
        // @Precondition:CYP-111
        return new RegExp(`@${preconditionPrefix}(${projectKey}-\\d+)`);
    }
    // @CYP-111
    return new RegExp(`@(${projectKey}-\\d+)`);
}
