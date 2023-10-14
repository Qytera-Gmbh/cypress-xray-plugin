import { logWarning } from "../../logging/logging";
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

export function getMultipartFeatures(
    input: CucumberMultipartFeature[],
    options: {
        testExecutionIssueKey?: string;
        includeScreenshots?: boolean;
        projectKey: string;
        useCloudTags: boolean;
    }
) {
    const tests: CucumberMultipartFeature[] = [];
    input.forEach((result: CucumberMultipartFeature) => {
        const test: CucumberMultipartFeature = {
            ...result,
        };
        if (options?.testExecutionIssueKey) {
            // For feature tags, there's no Cloud/Server distinction for some reason.
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
                        options.useCloudTags
                    );
                }
                // TODO: skip untagged elements
                const modifiedElement: CucumberMultipartElement = {
                    ...element,
                    steps: getSteps(element, options?.includeScreenshots),
                };
                elements.push(modifiedElement);
            } catch (error: unknown) {
                logWarning(
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
    useCloudTags: boolean
): void {
    const issueKeys: string[] = [];
    if (element.tags) {
        for (const tag of element.tags) {
            const matches = tag.name.match(getScenarioTagRegex(projectKey, useCloudTags));
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
                },
                element.tags,
                issueKeys,
                useCloudTags
            );
        }
    }
    if (issueKeys.length === 0) {
        throw missingTestKeyInCucumberScenarioError(element, projectKey, useCloudTags);
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
