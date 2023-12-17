import { LOG, Level } from "../../logging/logging";
import { getScenarioTagRegex } from "../../preprocessing/preprocessing";
import {
    CucumberMultipartElement,
    CucumberMultipartFeature,
    CucumberMultipartStep,
    CucumberMultipartTag,
} from "../../types/xray/requests/importExecutionCucumberMultipart";
import { dedent } from "../../util/dedent";
import {
    errorMessage,
    missingTestKeyInCucumberScenarioError,
    multipleTestKeysInCucumberScenarioError,
} from "../../util/errors";

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
        testExecutionIssueKey?: string;
        includeScreenshots?: boolean;
        projectKey: string;
        useCloudTags: boolean;
        testPrefix?: string;
    }
): CucumberMultipartFeature[] {
    const tests: CucumberMultipartFeature[] = [];
    input.forEach((result: CucumberMultipartFeature) => {
        const test: CucumberMultipartFeature = {
            ...result,
        };
        if (options?.testExecutionIssueKey) {
            const testExecutionIssueTag: CucumberMultipartTag = {
                name: `@${options.testExecutionIssueKey}`,
            };
            // Xray uses the first encountered issue tag for deducing the test execution issue.
            if (result.tags) {
                test.tags = [testExecutionIssueTag, ...result.tags];
            } else {
                test.tags = [testExecutionIssueTag];
            }
        }
        const elements: CucumberMultipartElement[] = [];
        result.elements.forEach((element: CucumberMultipartElement) => {
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
                        steps: getSteps(element, options?.includeScreenshots),
                    };
                    elements.push(modifiedElement);
                }
            } catch (error: unknown) {
                LOG.message(
                    Level.WARNING,
                    dedent(`
                        Skipping result upload for ${element.type}: ${element.name}

                        ${errorMessage(error)}
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
            } else if (matches.length === 2) {
                issueKeys.push(matches[1]);
            }
        }
        if (issueKeys.length > 1) {
            throw multipleTestKeysInCucumberScenarioError(
                {
                    name: element.name,
                    keyword: element.keyword,
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
                name: element.name,
                keyword: element.keyword,
                steps: element.steps.map((step: CucumberMultipartStep) => {
                    return { keyword: step.keyword, text: step.name };
                }),
            },
            projectKey,
            isXrayCloud,
            testPrefix
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
