import path from "node:path";
import {
    CucumberMultipartElement,
    CucumberMultipartFeature,
    CucumberMultipartStep,
    CucumberMultipartTag,
} from "../../../../../../types/xray/requests/import-execution-cucumber-multipart";
import { dedent } from "../../../../../../util/dedent";
import {
    errorMessage,
    missingTestKeyInCucumberScenarioError,
    multipleTestKeysInCucumberScenarioError,
} from "../../../../../../util/errors";
import { Level, Logger } from "../../../../../../util/logging";
import { getScenarioTagRegex } from "../../../../../preprocessor/commands/parsing/scenario";

/**
 * Modifies the input Cucumber JSON results by adding test execution issue tags and filtering
 * screenshots, based on the options provided. The function also asserts that every test contained
 * within the results has been appropriately tagged with either Xray cloud or Xray server tags.
 *
 * @param input - the Cucumber JSON results
 * @param options - the options for results modification
 * @returns the modified Cucumber JSON results
 */
export function buildMultipartFeatures(
    input: CucumberMultipartFeature[],
    options: {
        includeScreenshots?: boolean;
        projectKey: string;
        projectRoot: string;
        testExecutionIssueKey?: string;
        testPrefix?: string;
        useCloudTags: boolean;
    },
    logger: Logger
): CucumberMultipartFeature[] {
    const tests: CucumberMultipartFeature[] = [];
    input.forEach((result: CucumberMultipartFeature) => {
        const test: CucumberMultipartFeature = {
            ...result,
        };
        if (options.testExecutionIssueKey) {
            const testExecutionIssueTag: CucumberMultipartTag = {
                name: `@${options.testExecutionIssueKey}`,
            };
            // Xray uses the first encountered issue tag for deducing the test execution issue.
            // Note: The tag is a feature tag, not a scenario tag!
            if (result.tags) {
                test.tags = [testExecutionIssueTag, ...result.tags];
            } else {
                test.tags = [testExecutionIssueTag];
            }
        }
        const elements: CucumberMultipartElement[] = [];
        result.elements.forEach((element: CucumberMultipartElement) => {
            const filepath = path.resolve(options.projectRoot, result.uri);
            try {
                if (element.type === "scenario") {
                    assertScenarioContainsIssueKey(
                        element,
                        options.projectKey,
                        options.useCloudTags,
                        options.testPrefix
                    );
                    const modifiedElement: CucumberMultipartElement = {
                        ...element,
                        steps: getSteps(element, options.includeScreenshots),
                    };
                    elements.push(modifiedElement);
                }
            } catch (error: unknown) {
                const elementDescription = `${element.type[0].toUpperCase()}${element.type.substring(
                    1
                )}: ${element.name.length > 0 ? element.name : "<no name>"}`;
                logger.message(
                    Level.WARNING,
                    dedent(`
                        ${filepath}

                          ${elementDescription}

                            Skipping result upload.

                              Caused by: ${errorMessage(error)}
                    `)
                );
            }
        });
        if (elements.length > 0) {
            test.elements = elements;
            tests.push(test);
        }
    });
    return tests;
}

function assertScenarioContainsIssueKey(
    element: CucumberMultipartElement,
    projectKey: string,
    isXrayCloud: boolean,
    testPrefix?: string
): void {
    const issueKeys: string[] = [];
    if (element.tags) {
        for (const tag of element.tags) {
            const matches = tag.name.match(getScenarioTagRegex(projectKey, testPrefix));
            if (!matches) {
                continue;
            }
            // We know the regex: the match will contain the value in the first group.
            issueKeys.push(matches[1]);
        }
        if (issueKeys.length > 1) {
            throw multipleTestKeysInCucumberScenarioError(
                {
                    keyword: element.keyword,
                    name: element.name,
                    steps: element.steps.map((step: CucumberMultipartStep) => {
                        return { keyword: step.keyword, text: step.name };
                    }),
                },
                element.tags,
                issueKeys,
                isXrayCloud
            );
        }
    }
    if (issueKeys.length === 0) {
        throw missingTestKeyInCucumberScenarioError(
            {
                keyword: element.keyword,
                name: element.name,
                steps: element.steps.map((step: CucumberMultipartStep) => {
                    return { keyword: step.keyword, text: step.name };
                }),
                tags: element.tags,
            },
            projectKey,
            isXrayCloud
        );
    }
}

function getSteps(
    element: CucumberMultipartElement,
    includeScreenshots?: boolean
): CucumberMultipartStep[] {
    const steps: CucumberMultipartStep[] = [];
    element.steps.forEach((step: CucumberMultipartStep) => {
        steps.push({
            ...step,
            embeddings: includeScreenshots ? step.embeddings : [],
        });
    });
    return steps;
}
